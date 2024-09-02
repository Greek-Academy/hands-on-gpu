import {
  AfterHookCallback,
  BeforeHookCallback,
} from '../usecases/frames/callback-interface';
import { Canvas } from './canvas';
import { GPURenderContext } from './gpu-render-context';
import { GPURenderEngine } from './gpu-render-engine';

type Context = {
  engine: GPURenderEngine;
  canvas: Canvas;
  textureFormat: GPUTextureFormat;
};

type RenderHooks = {
  beforeHooks: BeforeHookCallback[];
  afterHooks: AfterHookCallback[];
};

export function runAnimationFrame(
  { engine, canvas, textureFormat }: Context,
  { beforeHooks = [], afterHooks = [] }: RenderHooks
) {
  const frame = () => {
    const context = setupRenderContext(engine.device, canvas);

    beforeHooks.forEach((callback: BeforeHookCallback) => {
      callback(engine, textureFormat);
    });

    engine.render(context);
    engine.submitQueue([context.completeRecording()]);

    afterHooks.forEach((callback: AfterHookCallback) => {
      callback(engine);
    });

    // 再起呼び出しでフレーム描画処理を無限ループする
    requestAnimationFrame(frame);
  };

  frame();
}

/**
 * フレームの描画で使用するための context を生成する処理
 * CommandEncoder と RenderPassDescripter は Queue へ格納後は使い回し不可
 *
 * @todo ハンズオン用に一部設定値をハードコーディングしているため
 *       再利用性を上げる場合は引数拡張等で対応してください
 */
function setupRenderContext(device: GPUDevice, canvas: Canvas) {
  const encoder = device.createCommandEncoder();
  const view = canvas.context.getCurrentTexture().createView();
  const descripter: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view,
        clearValue: [0, 0, 0, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  return GPURenderContext.new(encoder, descripter);
}
