// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../../../core/platform/platform.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

const {render, html} = LitHtml;

export interface AdornerData {
  name: string;
  content: HTMLElement;
}

export class Adorner extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-adorner`;
  name = '';

  private readonly shadow = this.attachShadow({mode: 'open'});
  private isToggle = false;
  private ariaLabelDefault?: string;
  private ariaLabelActive?: string;
  private content?: HTMLElement;

  set data(data: AdornerData) {
    this.name = data.name;
    data.content.slot = 'content';
    this.content?.remove();
    this.append(data.content);
    this.content = data.content;
    this.render();
  }

  connectedCallback(): void {
    if (!this.getAttribute('aria-label')) {
      this.setAttribute('aria-label', this.name);
    }
  }

  isActive(): boolean {
    return this.getAttribute('aria-pressed') === 'true';
  }

  /**
   * Toggle the active state of the adorner. Optionally pass `true` to force-set
   * an active state; pass `false` to force-set an inactive state.
   */
  toggle(forceActiveState?: boolean): void {
    if (!this.isToggle) {
      return;
    }
    const shouldBecomeActive = forceActiveState === undefined ? !this.isActive() : forceActiveState;
    this.setAttribute('aria-pressed', Boolean(shouldBecomeActive).toString());
    this.setAttribute('aria-label', (shouldBecomeActive ? this.ariaLabelActive : this.ariaLabelDefault) || this.name);
  }

  show(): void {
    this.classList.remove('hidden');
  }

  hide(): void {
    this.classList.add('hidden');
  }

  /**
   * Make adorner interactive by responding to click events with the provided action
   * and simulating ARIA-capable toggle button behavior.
   */
  addInteraction(action: EventListener, options: {
    ariaLabelDefault: Platform.UIString.LocalizedString,
    ariaLabelActive: Platform.UIString.LocalizedString,
    isToggle?: boolean,
    shouldPropagateOnKeydown?: boolean,
  }): void {
    const {isToggle = false, shouldPropagateOnKeydown = false, ariaLabelDefault, ariaLabelActive} = options;

    this.isToggle = isToggle;
    this.ariaLabelDefault = ariaLabelDefault;
    this.ariaLabelActive = ariaLabelActive;
    this.setAttribute('aria-label', ariaLabelDefault);

    if (isToggle) {
      this.addEventListener('click', () => {
        this.toggle();
      });
      this.toggle(false /* initialize inactive state */);
    }

    this.addEventListener('click', action);

    // Simulate an ARIA-capable toggle button
    this.classList.add('clickable');
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    this.addEventListener('keydown', event => {
      if (event.code === 'Enter' || event.code === 'Space') {
        this.click();
        if (!shouldPropagateOnKeydown) {
          event.stopPropagation();
        }
      }
    });
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    // eslint-disable-next-line rulesdir/ban_style_tags_in_lit_html
    render(html`
      <style>
        :host {
          display: inline-flex;
        }

        :host(.hidden) {
          display: none;
        }

        :host(.clickable) {
          cursor: pointer;
        }

        slot {
          display: inline-flex;
          box-sizing: border-box;
          height: 13px;
          line-height: 13px;
          padding: 0 6px;
          font-size: 8.5px;
          color: var(--override-adorner-text-color, var(--color-text-primary));
          background-color: var(--override-adorner-background-color, var(--color-background-elevation-1));
          border: 1px solid var(--override-adorner-border-color, var(--color-details-hairline));
          border-radius: 10px;
        }

        :host(:focus) slot {
          border-color: var(--override-adorner-focus-border-color, var(--color-primary));
        }

        :host([aria-pressed=true]) slot {
          color: var(--override-adorner-active-text-color, var(--color-background));
          background-color: var(--override-adorner-active-background-color, var(--color-primary));
        }

        ::slotted(*) {
          height: 10px;
        }
      </style>

      <slot name="content"></slot>
    `, this.shadow, {
      host: this,
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-adorner', Adorner);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-adorner': Adorner;
  }
}
