import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../theme';

interface ButtonOptions {
  fillColor?: number;
  hoverColor?: number;
  textColor?: string;
  borderColor?: number;
  fontSize?: string;
  depth?: number;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onPress: () => void,
  options: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const fillColor = options.fillColor ?? COLORS.orange;
  const hoverColor = options.hoverColor ?? COLORS.marigold;
  const borderColor = options.borderColor ?? COLORS.cream;

  const background = scene.add
    .rectangle(0, 0, width, height, fillColor)
    .setStrokeStyle(2, borderColor)
    .setInteractive({ useHandCursor: true });
  background.setData('normal-fill', fillColor);
  background.setData('selected', false);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_FAMILY,
      fontSize: options.fontSize ?? '14px',
      fontStyle: 'bold',
      color: options.textColor ?? '#24150f',
      align: 'center',
    })
    .setOrigin(0.5);

  const button = scene.add
    .container(x, y, [background, text])
    .setSize(width, height)
    .setDepth(options.depth ?? 1);

  background.on('pointerover', () => background.setFillStyle(hoverColor));
  background.on('pointerout', () =>
    background.setFillStyle(
      background.getData('selected') ? COLORS.marigold : fillColor,
    ),
  );
  background.on('pointerdown', () => background.setScale(0.97));
  background.on('pointerup', () => {
    background.setScale(1);
    onPress();
  });
  background.on('pointerupoutside', () => background.setScale(1));

  return button;
}

export function setButtonSelected(
  button: Phaser.GameObjects.Container,
  selected: boolean,
): void {
  const background = button.getAt(0) as Phaser.GameObjects.Rectangle;
  background.setData('selected', selected);
  background.setFillStyle(
    selected ? COLORS.marigold : (background.getData('normal-fill') as number),
  );
}
