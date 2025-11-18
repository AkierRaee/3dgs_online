#
# Copyright (C) 2023, Inria
# GRAPHDECO research group, https://team.inria.fr/graphdeco
# All rights reserved.
#
# This software is free for non-commercial, research and evaluation use 
# under the terms of the LICENSE.md file.
#
# For inquiries contact  george.drettakis@inria.fr
#

import torch
from scene import Scene
import os
from tqdm import tqdm
from os import makedirs
from gaussian_renderer import render
import torchvision
from utils.general_utils import safe_state
from argparse import ArgumentParser
from arguments import ModelParams, PipelineParams, get_combined_args
from gaussian_renderer import GaussianModel

import cv2
import numpy as np
from utils.graphics_utils import getWorld2View2
from utils.pose_utils import generate_ellipse_path, generate_spiral_path_from_views

try:
    from diff_gaussian_rasterization import SparseGaussianAdam
    SPARSE_ADAM_AVAILABLE = True
except:
    SPARSE_ADAM_AVAILABLE = False


def render_set(model_path, name, iteration, views, gaussians, pipeline, background, train_test_exp, separate_sh):
    render_path = os.path.join(model_path, name, "ours_{}".format(iteration), "renders")
    gts_path = os.path.join(model_path, name, "ours_{}".format(iteration), "gt")

    makedirs(render_path, exist_ok=True)
    makedirs(gts_path, exist_ok=True)

    for idx, view in enumerate(tqdm(views, desc="Rendering progress")):
        rendering = render(view, gaussians, pipeline, background, use_trained_exp=train_test_exp, separate_sh=separate_sh)["render"]
        gt = view.original_image[0:3, :, :]

        if args.train_test_exp:
            rendering = rendering[..., rendering.shape[-1] // 2:]
            gt = gt[..., gt.shape[-1] // 2:]

        torchvision.utils.save_image(rendering, os.path.join(render_path, '{0:05d}'.format(idx) + ".png"))
        torchvision.utils.save_image(gt, os.path.join(gts_path, '{0:05d}'.format(idx) + ".png"))


def render_video(model_path, iteration, views, gaussians, pipeline, background, fps=60, mode='ellipse', save_image=False):
    """渲染视频序列，通过生成相机路径"""
    render_path = os.path.join(model_path, 'video', "ours_{}".format(iteration))
    makedirs(render_path, exist_ok=True)
    
    # 使用第一个视图作为参考
    view = views[0]
    
    # 选择不同模式
    if mode == 'spiral':
        render_poses = generate_spiral_path_from_views(views, n_frames=600)
    elif mode == 'ellipse':  # 默认使用椭圆路径
        render_poses = generate_ellipse_path(views, n_frames=600)
    
    # 设置视频编码器和尺寸
    size = (view.original_image.shape[2], view.original_image.shape[1])
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_path = os.path.join(render_path, os.path.basename(model_path) + '.mp4')
    final_video = cv2.VideoWriter(video_path, fourcc, fps, size)
    
    # 渲染每一帧
    for idx, pose in enumerate(tqdm(render_poses, desc="Rendering video")):
        # 更新视图的变换矩阵
        view.world_view_transform = torch.tensor(getWorld2View2(pose[:3, :3].T, pose[:3, 3], view.trans, view.scale)).transpose(0, 1).cuda()
        view.full_proj_transform = (view.world_view_transform.unsqueeze(0).bmm(view.projection_matrix.unsqueeze(0))).squeeze(0)
        view.camera_center = view.world_view_transform.inverse()[3, :3]
        
        # 渲染当前视角
        rendering = render(view, gaussians, pipeline, background)["render"]
        img = torch.clamp(rendering, min=0., max=1.)
        
        # 可选：保存每一帧为图像
        if save_image:
            torchvision.utils.save_image(img, os.path.join(render_path, '{0:05d}'.format(idx) + ".png"))
        
        # 转换为OpenCV格式并写入视频
        video_img = (img.permute(1, 2, 0).detach().cpu().numpy() * 255.).astype(np.uint8)
        # 转换颜色空间从RGB到BGR（OpenCV使用BGR）
        video_img = cv2.cvtColor(video_img, cv2.COLOR_RGB2BGR)
        final_video.write(video_img)
    
    # 释放视频写入器
    final_video.release()
    print(f'Video saved to: {video_path}')



def render_sets(dataset : ModelParams, iteration : int, pipeline : PipelineParams, skip_train : bool, skip_test : bool, separate_sh: bool):
    with torch.no_grad():
        gaussians = GaussianModel(dataset.sh_degree)
        scene = Scene(dataset, gaussians, load_iteration=iteration, shuffle=False)

        bg_color = [1,1,1] if dataset.white_background else [0, 0, 0]
        background = torch.tensor(bg_color, dtype=torch.float32, device="cuda")

        # 检查是否要渲染视频
        if hasattr(args, 'video') and args.video:
            render_video(
                dataset.model_path, 
                scene.loaded_iter, 
                scene.getTrainCameras(), 
                gaussians, 
                pipeline, 
                background, 
                args.fps if hasattr(args, 'fps') else 30,
                args.mode if hasattr(args, 'mode') else 'ellipse',
                args.save_image if hasattr(args, 'save_image') else False
            )
            return  # 渲染视频后直接返回，不渲染训练/测试集

        if not skip_train:
             render_set(dataset.model_path, "train", scene.loaded_iter, scene.getTrainCameras(), gaussians, pipeline, background, dataset.train_test_exp, separate_sh)

        if not skip_test:
             render_set(dataset.model_path, "test", scene.loaded_iter, scene.getTestCameras(), gaussians, pipeline, background, dataset.train_test_exp, separate_sh)

if __name__ == "__main__":
    # Set up command line argument parser
    parser = ArgumentParser(description="Testing script parameters")
    model = ModelParams(parser, sentinel=True)
    pipeline = PipelineParams(parser)
    parser.add_argument("--iteration", default=-1, type=int)
    parser.add_argument("--skip_train", action="store_true")
    parser.add_argument("--skip_test", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    # 添加视频相关参数
    parser.add_argument("--video", action="store_true", help="Render a video instead of images")
    parser.add_argument("--fps", default=30, type=int, help="Frames per second for video")
    parser.add_argument("--mode", default="ellipse", choices=["ellipse", "spiral"], help="Camera path mode for video rendering")
    parser.add_argument("--save_image", action="store_true", help="Save individual frames as images")
    args = get_combined_args(parser)
    print("Rendering " + args.model_path)

    # Initialize system state (RNG)
    safe_state(args.quiet)

    render_sets(model.extract(args), args.iteration, pipeline.extract(args), args.skip_train, args.skip_test, SPARSE_ADAM_AVAILABLE)