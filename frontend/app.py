from __future__ import annotations

import os
import time
from typing import List, Optional

import gradio as gr
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")


def submit_job(files: List[str], scene_name: str, upload_type: str):
    if not files:
        return "请先选择需要上传的文件。", None, None, None, None

    multipart = []
    if upload_type == "zip":
        if len(files) != 1:
            return "Zip 模式仅允许一个文件", None, None, None, None
        f = files[0]
        multipart.append(("files", (os.path.basename(f), open(f, "rb"), "application/zip")))
    else:
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            mime = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"
            multipart.append(("files", (os.path.basename(f), open(f, "rb"), mime)))

    data = {"upload_type": upload_type}
    if scene_name:
        data["scene_name"] = scene_name

    try:
        resp = requests.post(f"{BACKEND_URL}/reconstruct_stream", files=multipart, data=data, timeout=None)
        if resp.status_code != 200:
            return f"后端返回错误：{resp.status_code} {resp.text}", None, None, None, None
        js = resp.json()
    except Exception as e:
        return f"请求失败：{e}", None, None, None, None

    job_id = js.get("job_id")
    log_url = f"{BACKEND_URL}{js.get('log_url')}"
    status_url = f"{BACKEND_URL}{js.get('status_url')}"
    md = f"""
- 任务ID：{job_id}
- 上传类型：{upload_type}
- 日志：{log_url}
"""
    return md, job_id, log_url, status_url, None


with gr.Blocks(title="3DGS Online") as demo:
    gr.Markdown("# 3DGS 在线重建")
    with gr.Row():
        with gr.Column(scale=3):
            upload_type = gr.Radio(
                label="上传类型",
                choices=["files", "folder", "zip"],
                value="files",
                info="支持：多图片 / 整个文件夹 / zip 压缩包 (只含图片)",
            )
            # 合并为一个容器：根据类型变化，复用同一个 Files 控件
            # 说明：gradio 目前不支持在运行时切换 file_count 参数，因此我们使用两个 Files 控件并通过 visible 切换；
            # 但在视觉上它们呈现为一个“上传区域”。
            files_multi = gr.Files(label="上传区：多图片 / 文件夹 / zip", type="filepath", height=260, visible=True, file_count="multiple")
            folder_picker = gr.Files(label="上传区：选择一个文件夹", type="filepath", height=260, visible=False, file_count="directory")
            zip_picker = gr.File(label="上传区：选择一个zip", type="filepath", height=120, visible=False, file_types=[".zip"]) 
            files = gr.State([])

            def _toggle(uptype):
                # 切换可见性
                return (
                    gr.update(visible=uptype == "files"),
                    gr.update(visible=uptype == "folder"),
                    gr.update(visible=uptype == "zip"),
                )

            upload_type.change(_toggle, inputs=upload_type, outputs=[files_multi, folder_picker, zip_picker])

            # 同步文件值
            def _sync(uptype, multi, folder, zipf):
                if uptype == "zip":
                    return [zipf] if zipf else []
                if uptype == "folder":
                    return folder or []
                return multi or []

            upload_type.change(_sync, inputs=[upload_type, files_multi, folder_picker, zip_picker], outputs=files)
            files_multi.change(lambda v: v, inputs=files_multi, outputs=files)
            folder_picker.change(lambda v: v, inputs=folder_picker, outputs=files)
            zip_picker.change(lambda v: [v] if v else [], inputs=zip_picker, outputs=files)

            scene_name = gr.Textbox(label="场景名称（可选，如北京大学生命楼）", placeholder="beijdxshengmingloy")
            btn = gr.Button("重建", variant="primary")

            # 进度条与阶段文本
            stage_markdown = gr.Markdown("等待提交…")
            with gr.Row():
                with gr.Column(scale=2):
                    with gr.Tab("训练进度"):
                        # 固定高度与行数，避免溢出；由 Textbox 内部滚动
                        log_view = gr.Textbox(label="实时日志", lines=22, max_lines=2000, interactive=False, value="(空)")
                        out_md = gr.Markdown()
                    with gr.Tab("训练结果"):
                        # 仅以 Markdown 列表展示四个链接，避免把 URL 误传给 File 组件
                        result_list = gr.Markdown("尚未完成")

    def run_stream(files, scene_name, upload_type):
        md, job_id, log_url, status_url, _ = submit_job(files, scene_name, upload_type)
        # 初始状态（结果为空，日志提示）
        yield md, "任务已提交，日志实时输出中…", "(初始化中)", "尚未完成"
        if not job_id:
            yield md + "\n无法解析任务ID。", "失败", "(失败)", "失败"
            return
        # 轮询结果接口直到完成
        while True:
            try:
                r = requests.get(status_url, timeout=3)
                js = r.json() if r.status_code == 200 else {"stage": "unknown"}
            except Exception:
                js = {"stage": "unknown"}
            stage = js.get("stage")
            # 拉取日志末尾内容
            # 逐行递增：拉取全量，再在前端持久化最后已读行数，按差量追加
            if not hasattr(run_stream, "_log_pos"):
                run_stream._log_pos = 0
                run_stream._log_cache = []
            try:
                log_resp = requests.get(log_url, timeout=3)
                if log_resp.status_code == 200:
                    all_lines = log_resp.text.splitlines()
                    new_lines = all_lines[run_stream._log_pos :]
                    run_stream._log_pos = len(all_lines)
                    run_stream._log_cache.extend(new_lines)
                    # 限制缓存大小，避免内存增长
                    if len(run_stream._log_cache) > 2000:
                        run_stream._log_cache = run_stream._log_cache[-2000:]
                    log_text = "\n".join(run_stream._log_cache[-400:])
                else:
                    log_text = f"日志获取失败: {log_resp.status_code}"
            except Exception as e:
                log_text = f"日志获取异常: {e}"
            if js.get("done"):
                zip_url = js.get("zip_url")
                point_cloud_url = js.get("point_cloud_url")
                cameras_url = js.get("cameras_url")
                final_md = md + (
                    f"\n- 压缩包：{BACKEND_URL}{zip_url}" if zip_url else ""
                ) + (
                    f"\n- 点云：{BACKEND_URL}{point_cloud_url}" if point_cloud_url else ""
                ) + (
                    f"\n- 相机：{BACKEND_URL}{cameras_url}" if cameras_url else ""
                )
                result_md = "\n".join([
                    f"1. {job_id}.zip: {BACKEND_URL}{zip_url}" if zip_url else f"1. {job_id}.zip: (未生成)",
                    f"2. point_cloud.ply: {BACKEND_URL}{point_cloud_url}" if point_cloud_url else "2. point_cloud.ply: (未找到)",
                    f"3. cameras.json: {BACKEND_URL}{cameras_url}" if cameras_url else "3. cameras.json: (未找到)",
                    f"4. {job_id}.log: {log_url}",
                ])
                yield final_md, "完成", log_text, result_md
                break
            # 中间状态持续输出简单阶段说明
            yield md, f"进行中…阶段: {stage}" if stage else "进行中…", log_text, "尚未完成"
            time.sleep(2)

    btn.click(
        fn=run_stream,
        inputs=[files, scene_name, upload_type],
        outputs=[out_md, stage_markdown, log_view, result_list],
        queue=True,
    )

if __name__ == "__main__":
    # 选择可用端口：优先 FRONTEND_PORT，否则自动探测空闲端口（避免使用0/None的兼容性问题）
    import socket

    def _find_free_port(host: str, preferred: Optional[int]) -> int:
        if preferred:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                try:
                    s.bind((host, preferred))
                    return preferred
                except OSError:
                    pass
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, 0))
            return s.getsockname()[1]

    share = os.getenv("GRADIO_SHARE", "false").lower() == "true"
    host = os.getenv("FRONTEND_HOST", "0.0.0.0")
    port_env = os.getenv("FRONTEND_PORT", "auto")
    preferred = None if port_env == "auto" else int(port_env)
    port = _find_free_port(host, preferred)
    demo.queue()
    demo.launch(server_name=host, server_port=port, share=share, show_error=True)