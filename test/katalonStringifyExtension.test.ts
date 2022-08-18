import { InMemoryLineWriter } from './InMemoryLineWriter.js';
import { KatalonStringifyExtension } from '../src/katalonStringifyExtension.js';
import { expect } from 'chai';
import { Key } from '@puppeteer/replay';

describe('KatalonStringifyExtension', () => {
  it('should correctly exports setViewport step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'setViewport' as const,
      width: 1905,
      height: 223,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    };
    const flow = { title: 'setViewport step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);
    expect(writer.toString()).to.equal('WebUI.setViewPortSize(1905, 223)\n');
  });

  it('should correctly exports navigate step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'navigate' as const,
      url: 'chrome://new-tab-page/',
      assertedEvents: [
        {
          type: 'navigation' as const,
          url: 'chrome://new-tab-page/',
          title: 'New Tab',
        },
      ],
    };
    const flow = { title: 'navigate step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);
    expect(writer.toString()).to.equal(
      'WebUI.navigateToUrl("chrome://new-tab-page/")\n',
    );
  });

  it('should correctly exports click step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'click' as const,
      target: 'main',
      selectors: ['#test'],
      offsetX: 1,
      offsetY: 1,
    };
    const flow = { title: 'click step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal('WebUI.click(to("#test"))\n');
  });

  it('should correctly exports change step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'change' as const,
      value: 'katalon',
      selectors: [['aria/Search'], ['#heading']],
      target: 'main',
    };
    const flow = { title: 'change step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal('setValue(to("#heading"), "katalon")\n');
  });

  it('should correctly exports keyDown step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'keyDown' as const,
      target: 'main',
      key: 'Enter' as Key,
      assertedEvents: [
        {
          type: 'navigation' as const,
          url: 'https://google.com',
          title: 'katalon - Google Search',
        },
      ],
    };
    const flow = { title: 'keyDown step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal(
      `WebUI.sendKeys(tox('//body'), Keys.chord(Keys.ENTER))\n`,
    );
  });

  it('should handle keyDown step when key is not supported', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'keyDown' as const,
      target: 'main',
      key: 'KEY_DOESNT_EXIST' as Key,
      assertedEvents: [
        {
          type: 'navigation' as const,
          url: 'https://google.com',
          title: 'katalon - Google Search',
        },
      ],
    };
    const flow = { title: 'keyDown step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal('\n');
  });

  it('should correctly exports scroll step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'scroll' as const,
      target: 'main',
      x: 0,
      y: 805,
    };
    const flow = { title: 'scroll step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal(`WebUI.scrollToPosition(0, 805)\n`);
  });

  it('should correctly exports waitForElement step if operator is "=="', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'waitForElement' as const,
      selectors: ['#test'],
      operator: '==' as const,
      count: 2,
    };
    const flow = { title: 'waitForElement step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal(
      `WebUI.waitForElementVisible(to("#test"), 3)\n`,
    );
  });

  it('should correctly add Hover Step', async () => {
    const ext = new KatalonStringifyExtension();
    const step = {
      type: 'hover' as const,
      selectors: ['#test'],
    };
    const flow = { title: 'Hover step', steps: [step] };

    const writer = new InMemoryLineWriter('  ');
    await ext.stringifyStep(writer, step, flow);

    expect(writer.toString()).to.equal(`WebUI.mouseOver(to("#test"))\n`);
  });
});
