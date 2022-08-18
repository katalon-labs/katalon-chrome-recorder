import {
  ChangeStep,
  ClickStep,
  DoubleClickStep,
  EmulateNetworkConditionsStep,
  HoverStep,
  KeyDownStep,
  KeyUpStep,
  LineWriter,
  NavigateStep,
  PuppeteerStringifyExtension,
  ScrollStep,
  Selector,
  SetViewportStep,
  Step,
  UserFlow,
  WaitForElementStep,
} from '@puppeteer/replay';
import { SupportedKeys, DowncaseKeys } from './types.js';

export class KatalonStringifyExtension extends PuppeteerStringifyExtension {
  #formatAsJSLiteral(value: string) {
    return JSON.stringify(value);
  }

  async beforeAllSteps(out: LineWriter, flow: UserFlow): Promise<void> {
    out.appendLine(
      `import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.testobject.ConditionType as ConditionType
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

`,
    );
    out.appendLine(
      `
WebUI.comment("${flow.title}")
WebUI.openBrowser('')`,
    );
  }

  async afterAllSteps(out: LineWriter): Promise<void> {
    out.appendLine(
      `
def to(css) {
  TestObject to = new TestObject(css)
  to.addProperty('css', ConditionType.EQUALS, css)
  return to	
}

def tox(xpath) {
  TestObject tox = new TestObject(xpath)
  tox.addProperty('xpath', ConditionType.EQUALS, xpath)
  return tox
}

def setValue(TestObject to, def value) {
  def we = WebUI.findWebElement(to, 3)
  def tagName = we.getTagName()
  
  if ("select".equals(tagName)) {
    WebUI.selectOptionByValue(to, value, false)
  } else {
    WebUI.setText(to, value)
  }
}
      `,
    );
  }

  async stringifyStep(
    out: LineWriter,
    step: Step,
    flow: UserFlow,
  ): Promise<void> {
    this.#appendStepType(out, step, flow);
  }

  #appendStepType(out: LineWriter, step: Step, flow: UserFlow): void {
    switch (step.type) {
      case 'setViewport':
        return this.#appendViewportStep(out, step);
      case 'navigate':
        return this.#appendNavigateStep(out, step);
      case 'click':
        return this.#appendClickStep(out, step, flow);
      case 'change':
        return this.#appendChangeStep(out, step, flow);
      case 'keyDown':
        return this.#appendKeyDownStep(out, step);
      // case 'keyUp':
      //   return this.#appendKeyUpStep(out, step);
      case 'scroll':
        return this.#appendScrollStep(out, step, flow);
      // case 'doubleClick':
      //   return this.#appendDoubleClickStep(out, step, flow);
      // case 'emulateNetworkConditions':
      //   return this.#appendEmulateNetworkConditionsStep(out, step);
      case 'hover':
        return this.#appendHoverStep(out, step, flow);
      case 'waitForElement':
        return this.#appendWaitForElementStep(out, step, flow);
      default:
        return this.logStepsNotImplemented(step);
    }
  }

  #appendNavigateStep(out: LineWriter, step: NavigateStep): void {
    out.appendLine(`WebUI.navigateToUrl(${this.#formatAsJSLiteral(step.url)})`);
  }

  #appendViewportStep(out: LineWriter, step: SetViewportStep): void {
    out.appendLine(`WebUI.setViewPortSize(${step.width}, ${step.height})`);
  }

  #appendClickStep(out: LineWriter, step: ClickStep, flow: UserFlow): void {
    const domSelector = this.getSelector(step.selectors, flow);

    const hasRightButton = step.button && step.button === 'secondary';
    if (domSelector) {
      hasRightButton
        ? out.appendLine(`WebUI.rightClick(${domSelector})`)
        : out.appendLine(`WebUI.click(to(${domSelector}))`);
    } else {
      console.log(
        `Warning: The click on ${step.selectors} was not able to export to Katalon. Please adjust selectors and try again`,
      );
    }
  }

  #appendChangeStep(out: LineWriter, step: ChangeStep, flow: UserFlow): void {
    const domSelector = this.getSelector(step.selectors, flow);
    if (domSelector) {
      out.appendLine(
        `setValue(to(${domSelector}), ${this.#formatAsJSLiteral(step.value)})`,
      );
    }
  }

  #appendKeyDownStep(out: LineWriter, step: KeyDownStep): void {
    const pressedKey = step.key.toLowerCase() as DowncaseKeys;

    if (pressedKey in SupportedKeys) {
      const keyValue = SupportedKeys[pressedKey];
      out.appendLine(
        `WebUI.sendKeys(tox('//body'), Keys.chord(Keys.${keyValue}))`,
      );
    }
  }

  #appendKeyUpStep(out: LineWriter, step: KeyUpStep): void {
    const pressedKey = step.key.toLowerCase() as DowncaseKeys;

    if (pressedKey in SupportedKeys) {
      const keyValue = SupportedKeys[pressedKey];
      out.appendLine(
        `.perform(function() {
          const actions = this.actions({async: true});

          return actions
          .keyUp(this.Keys.${keyValue});
        })`,
      );
    }
  }

  #appendScrollStep(out: LineWriter, step: ScrollStep, flow: UserFlow): void {
    if ('selectors' in step) {
      const domSelector = this.getSelector(step.selectors, flow);
      out.appendLine(`WebUI.scrollToElement(to(${domSelector}))`);
    } else {
      out.appendLine(`WebUI.scrollToPosition(${step.x}, ${step.y})`);
    }
  }

  #appendDoubleClickStep(
    out: LineWriter,
    step: DoubleClickStep,
    flow: UserFlow,
  ): void {
    const domSelector = this.getSelector(step.selectors, flow);

    if (domSelector) {
      out.appendLine(`.doubleClick(${domSelector})`);
    } else {
      console.log(
        `Warning: The click on ${step.selectors} was not able to be exported to Katalon. Please adjust your selectors and try again.`,
      );
    }
  }

  #appendHoverStep(out: LineWriter, step: HoverStep, flow: UserFlow): void {
    const domSelector = this.getSelector(step.selectors, flow);

    if (domSelector) {
      out.appendLine(`WebUI.mouseOver(to(${domSelector}))`);
    } else {
      console.log(
        `Warning: The Hover on ${step.selectors} was not able to be exported to Katalon. Please adjust your selectors and try again.`,
      );
    }
  }

  #appendEmulateNetworkConditionsStep(
    out: LineWriter,
    step: EmulateNetworkConditionsStep,
  ): void {
    out.appendLine(`
    .setNetworkConditions({
      offline: false,
      latency: ${step.latency},
      download_throughput: ${step.download},
      upload_throughput: ${step.upload}
    })`);
  }

  #appendWaitForElementStep(
    out: LineWriter,
    step: WaitForElementStep,
    flow: UserFlow,
  ): void {
    const domSelector = this.getSelector(step.selectors, flow);
    // let assertionStatement;
    // if (domSelector) {
    //   switch (step.operator) {
    //     case '<=':
    //       assertionStatement = `browser.elements('css selector', ${domSelector}, function (result) {
    //         browser.assert.ok(result.value.length <= ${step.count}, 'element count is less than ${step.count}');
    //       });`;
    //       break;
    //     case '==':
    //       assertionStatement = `browser.expect.elements(${domSelector}).count.to.equal(${step.count});`;
    //       break;
    //     case '>=':
    //       assertionStatement = `browser.elements('css selector', ${domSelector}, function (result) {
    //         browser.assert.ok(result.value.length >= ${step.count}, 'element count is greater than ${step.count}');
    //       });`;
    //       break;
    //   }
    out.appendLine(`WebUI.waitForElementVisible(to(${domSelector}), ${step.timeout ? `${step.timeout}` : '3'})`);
    // } else {
    //   console.log(
    //     `Warning: The WaitForElement on ${step.selectors} was not able to be exported to Katalon. Please adjust your selectors and try again.`,
    //   );
    // }
  }

  #appendEndStep(out: LineWriter): void {
    out.appendLine(`.end();`);
  }

  getSelector(selectors: Selector[], flow: UserFlow): string | undefined {
    // Remove Aria selectors
    const nonAriaSelectors = this.filterArrayByString(selectors, 'aria/');

    let preferredSelector;

    // Give preference to user selector
    if (flow.selectorAttribute) {
      preferredSelector = this.filterArrayByString(
        nonAriaSelectors,
        flow.selectorAttribute,
      );
    }

    if (preferredSelector && preferredSelector[0]) {
      return `${this.#formatAsJSLiteral(
        Array.isArray(preferredSelector[0])
          ? preferredSelector[0][0]
          : preferredSelector[0],
      )}`;
    } else {
      return `${this.#formatAsJSLiteral(
        Array.isArray(nonAriaSelectors[0])
          ? nonAriaSelectors[0][0]
          : nonAriaSelectors[0],
      )}`;
    }
  }

  filterArrayByString(selectors: Selector[], filterValue: string): Selector[] {
    return selectors.filter((selector) =>
      filterValue === 'aria/'
        ? !selector[0].includes(filterValue)
        : selector[0].includes(filterValue),
    );
  }

  logStepsNotImplemented(step: Step): void {
    console.log(
      `Warning: Katalon Chrome Recorder does not handle migration of types ${step.type}.`,
    );
  }
}
