import { BooleanInput, Button, Container, Element, Label, SelectInput, SliderInput } from 'pcui';

import { Events } from '../events';
import { localize } from './localization';
import sceneExport from './svg/export.svg';

const createSvg = (svgString: string, args = {}) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new Element({
        dom: new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement,
        ...args
    });
};

export interface DLSSSettings {
    enabled: boolean;
    qualityMode: 'performance' | 'balanced' | 'quality' | 'ultra';
    temporalAccumulation: boolean;
    sharpening: number;
}

class DLSSSettingsDialog extends Container {
    show: () => Promise<DLSSSettings | null>;
    hide: () => void;
    destroy: () => void;

    constructor(events: Events, args = {}) {
        args = {
            ...args,
            id: 'dlss-settings-dialog',
            class: 'settings-dialog',
            hidden: true,
            tabIndex: -1
        };

        super(args);

        const dialog = new Container({
            id: 'dialog'
        });

        // header
        const headerIcon = createSvg(sceneExport, { id: 'icon' });
        const headerText = new Label({ id: 'text', text: localize('dlss.header') });
        const header = new Container({ id: 'header' });
        header.append(headerIcon);
        header.append(headerText);

        // enable DLSS
        const enableLabel = new Label({ class: 'label', text: localize('dlss.enable') });
        const enableBoolean = new BooleanInput({ class: 'boolean', value: false });
        const enableRow = new Container({ class: 'row' });
        enableRow.append(enableLabel);
        enableRow.append(enableBoolean);

        // quality mode
        const qualityLabel = new Label({ class: 'label', text: localize('dlss.quality') });
        const qualitySelect = new SelectInput({
            class: 'select',
            defaultValue: 'quality',
            options: [
                { v: 'performance', t: localize('dlss.performance') },
                { v: 'balanced', t: localize('dlss.balanced') },
                { v: 'quality', t: localize('dlss.qualityMode') },
                { v: 'ultra', t: localize('dlss.ultra') }
            ]
        });
        const qualityRow = new Container({ class: 'row' });
        qualityRow.append(qualityLabel);
        qualityRow.append(qualitySelect);

        // temporal accumulation
        const temporalLabel = new Label({ class: 'label', text: localize('dlss.temporal') });
        const temporalBoolean = new BooleanInput({ class: 'boolean', value: true });
        const temporalRow = new Container({ class: 'row' });
        temporalRow.append(temporalLabel);
        temporalRow.append(temporalBoolean);

        // sharpening
        const sharpeningLabel = new Label({ class: 'label', text: localize('dlss.sharpening') });
        const sharpeningSlider = new SliderInput({ 
            class: 'slider', 
            min: 0, 
            max: 1, 
            step: 0.1, 
            value: 0.3 
        });
        const sharpeningRow = new Container({ class: 'row' });
        sharpeningRow.append(sharpeningLabel);
        sharpeningRow.append(sharpeningSlider);

        // quality mode descriptions
        const descriptionLabel = new Label({ 
            class: 'description-label', 
            text: localize('dlss.description') 
        });

        // content
        const content = new Container({ id: 'content' });
        content.append(enableRow);
        content.append(qualityRow);
        content.append(temporalRow);
        content.append(sharpeningRow);
        content.append(descriptionLabel);

        // footer
        const footer = new Container({ id: 'footer' });

        const cancelButton = new Button({
            class: 'button',
            text: localize('render.cancel')
        });

        const okButton = new Button({
            class: 'button',
            text: localize('render.ok')
        });

        footer.append(cancelButton);
        footer.append(okButton);

        dialog.append(header);
        dialog.append(content);
        dialog.append(footer);

        this.append(dialog);

        // Update description based on quality mode
        const updateDescription = () => {
            const mode = qualitySelect.value;
            let description = '';
            switch (mode) {
                case 'performance':
                    description = localize('dlss.performanceDesc');
                    break;
                case 'balanced':
                    description = localize('dlss.balancedDesc');
                    break;
                case 'quality':
                    description = localize('dlss.qualityDesc');
                    break;
                case 'ultra':
                    description = localize('dlss.ultraDesc');
                    break;
            }
            descriptionLabel.text = description;
        };

        qualitySelect.on('change', updateDescription);
        
        // Enable/disable controls based on DLSS enable state
        const updateControlStates = () => {
            const enabled = enableBoolean.value;
            qualitySelect.enabled = enabled;
            temporalBoolean.enabled = enabled;
            sharpeningSlider.enabled = enabled;
        };

        enableBoolean.on('change', updateControlStates);

        // handle key bindings for enter and escape
        let onCancel: () => void;
        let onOK: () => void;

        cancelButton.on('click', () => onCancel());
        okButton.on('click', () => onOK());

        const keydown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onCancel();
                    break;
                case 'Enter':
                    if (!e.shiftKey) onOK();
                    break;
                default:
                    e.stopPropagation();
                    break;
            }
        };

        // reset UI and configure for current state
        const reset = () => {
            updateDescription();
            updateControlStates();
        };

        // function implementations
        this.show = () => {
            reset();

            this.hidden = false;
            this.dom.addEventListener('keydown', keydown);
            this.dom.focus();

            return new Promise<DLSSSettings | null>((resolve) => {
                onCancel = () => {
                    resolve(null);
                };

                onOK = () => {
                    const dlssSettings: DLSSSettings = {
                        enabled: enableBoolean.value,
                        qualityMode: qualitySelect.value as 'performance' | 'balanced' | 'quality' | 'ultra',
                        temporalAccumulation: temporalBoolean.value,
                        sharpening: sharpeningSlider.value
                    };

                    resolve(dlssSettings);
                };
            }).finally(() => {
                this.dom.removeEventListener('keydown', keydown);
                this.hide();
            });
        };

        this.hide = () => {
            this.hidden = true;
        };

        this.destroy = () => {
            this.hide();
            super.destroy();
        };
    }
}

export { DLSSSettingsDialog }; 