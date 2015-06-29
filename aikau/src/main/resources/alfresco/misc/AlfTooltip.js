/**
 * Copyright (C) 2005-2015 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * <p>This widget provides a way in which a widget model can be displayed when the mouse moves over another
 * widget. To use this tooltip you need to define a 
 * [widgets model to immediately render]{@link module:alfresco/misc/AlfTooltipDialog#widgets} and then another
 * [widget model]{@link module:alfresco/misc/AlfTooltipDialog#widgetsForTooltip} that will be displayed in the
 * tooltip when the mouse moves over any of the widgets in the first model.</p>
 * 
 * @example <caption>Example configuration:</caption>
 * {
 *    name: "alfresco/layout/ClassicWindow",
 *    config: {
 *    title: "Tooltip displays on mouse over logo",
 *    widgets: [
 *       {
 *          name: "alfresco/misc/AlfTooltip",
 *          config: {
 *             widgets: [
 *                {
 *                   name: "alfresco/logo/Logo"
 *                }
 *             ],
 *             widgetsForTooltip: [
 *                {
 *                   name: "alfresco/html/Label",
 *                   config: {
 *                      label: "This is the tooltip content"
 *                   }
 *                }
 *             ]
 *          }
 *       }
 *    ]
 * }
 * 
 * @example <caption>Example configuration with longer delay before displaying:</caption>
 * {
 *    name: "alfresco/layout/ClassicWindow",
 *    config: {
 *    title: "Tooltip displays on mouse over logo",
 *    widgets: [
 *       {
 *          name: "alfresco/misc/AlfTooltip",
 *          config: {
 *             mouseoverShowDelay: 1000,
 *             widgets: [
 *                {
 *                   name: "alfresco/logo/Logo"
 *                }
 *             ],
 *             widgetsForTooltip: [
 *                {
 *                   name: "alfresco/html/Label",
 *                   config: {
 *                      label: "This is the tooltip content"
 *                   }
 *                }
 *             ]
 *          }
 *       }
 *    ]
 * }
 * 
 * @example <caption>Example configuration using a click event rather than hover and width styling:</caption>
 * {
 *    name: "alfresco/layout/ClassicWindow",
 *    config: {
 *    title: "Tooltip displays on mouse over logo",
 *    widgets: [
 *       {
 *          name: "alfresco/misc/AlfTooltip",
 *          config: {
 *             widgets: [
 *                {
 *                   name: "alfresco/logo/Logo"
 *                }
 *             ],
 *             widgetsForTooltip: [
 *                {
 *                   name: "alfresco/html/Label",
 *                   config: {
 *                      label: "This is the tooltip content"
 *                   }
 *                }
 *             ],
 *             triggeringEvent: "click",
 *             tooltipStyle: "width: 350px;"
 *          }
 *       }
 *    ]
 * }
 * 
 * @module alfresco/misc/AlfTooltip
 * @extends external:dijit/Menu
 * @mixes module:alfresco/core/Core
 * @mixes module:alfresco/core/CoreWidgetProcessing
 * @author Dave Draper
 * @author Martin Doyle
 */
define(["dojo/_base/declare",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin",
        "dojo/text!./templates/AlfTooltip.html",
        "dijit/TooltipDialog",
        "alfresco/core/Core",
        "alfresco/core/CoreWidgetProcessing",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/on",
        "dijit/popup"], 
        function(declare, _WidgetBase, _TemplatedMixin, template, TooltipDialog, AlfCore, CoreWidgetProcessing,
                 lang, domConstruct, on, popup) {
   
   return declare([_WidgetBase, _TemplatedMixin, AlfCore, CoreWidgetProcessing], {
      
      /**
       * The HTML template to use for the widget.
       * @instance
       * @type {String}
       */
      templateString: template,
      
      /**
       * This is the widget model that will be displayed inside the tooltip.
       * 
       * @instance
       * @type {array}
       * @default null
       */
      widgetsForTooltip: null,

      /**
       * This is the widget model that will be immediately rendered. When the mouse is moved over any
       * of the widgets in this model then the tooltip will be created (if it hasn't previously been created)
       * and will then be displayed.
       * 
       * @instance
       * @type {array}
       * @default null
       */
      widgets: null,

      /**
       * A reference to the dijit/TooltipDialog that will be created.
       *
       * @instance
       * @type {object}
       * @default null
       */
      _tooltip: null,

      /**
       * The style to be applied to the tooltip. Default is null.
       *
       * @instance
       * @type {string}
       * @default null
       */
      tooltipStyle: null,

      /**
       * The Javascript "dojo/on" event to listen for. Default is mouseover.
       *
       * @instance
       * @type {string}
       * @default "mouseover"
       */
      triggeringEvent: "mouseover",

      /**
       * How long (ms) to delay displaying the tooltip on mouseover-triggered tooltips.
       *
       * @instance
       * @type {number}
       * @default
       */
      mouseoverShowDelay: 250,

      /**
       * How long (ms) to delay hiding the tooltip on mouseover-triggered tooltips.
       *
       * @instance
       * @type {number}
       * @default
       */
      mouseoutHideDelay: 250,

      /**
       * The pointer for the timeout that will display a tooltip
       *
       * @instance
       * @type {number}
       * @default
       */
      _showTooltipTimeout: 0,

      /**
       * The pointer for the timeout that will hide a tooltip
       *
       * @instance
       * @type {number}
       * @default
       */
      _hideTooltipTimeout: 0,

      /**
       * This is called to display the tooltip. If the tooltip hasn't been created at this point then it will be created.
       * 
       * @instance
       */
      showTooltip: function alfresco_misc_AlfTooltip__showTooltip() {
         if (!this._tooltip)
         {
            this.dialogContent = domConstruct.create("div");
            this.processWidgets(this.widgetsForTooltip, this.dialogContent);
            this._tooltip = new TooltipDialog({
               id: this.id + "_TOOLTIP",
               style: this.tooltipStyle,
               content: this.dialogContent,
               onMouseEnter: lang.hitch(this, this.onTooltipMouseover),
               onMouseLeave: lang.hitch(this, this.onTooltipMouseout)
            });
         }
         popup.open({
            popup: this._tooltip,
            around: this.domNode
         });
      },

      /**
       * Called to hide the tooltip. This is done when the mouse leaves the target area by default.
       * 
       * @instance
       */
      hideTooltip: function alfresco_misc_AlfTooltip__hideTooltip() {
         popup.close(this._tooltip);
      },

      /**
       * Sets up the mouse over listener for displaying the tooltip (if
       * [widgetsForTooltip]{@link module:alfresco/misc/AlfTooltipDialog#widgetsForTooltip} contains a widget
       * model) and then processes [widgets]{@link module:alfresco/misc/AlfTooltipDialog#widgets}.
       * 
       * @instance
       */
      postCreate: function alfresco_misc_AlfTooltip__postCreate() {
         if (this.widgetsForTooltip)
         {
            if (this.triggeringEvent === "mouseover") {
               on(this.domNode, "mouseover", lang.hitch(this, this.onMouseover));
               on(this.domNode, "mouseout", lang.hitch(this, this.onMouseout));
            } else {
               on(this.domNode, this.triggeringEvent, lang.hitch(this, this.showTooltip));
            }
         }
         else
         {
            this.alfLog("warn", "A tooltip dialog was configured without a 'widgetsForTooltip' attribute", this);
         }

         if (this.widgets)
         {
            this.processWidgets(this.widgets, this.domNode);
         }
      },

      onMouseover: function(){
         clearTimeout(this._hideTooltipTimeout);
         this._showTooltipTimeout = setTimeout(lang.hitch(this, this.showTooltip), this.mouseoverShowDelay);
      },

      onMouseout: function(){
         clearTimeout(this._showTooltipTimeout);
         this._hideTooltipTimeout = setTimeout(lang.hitch(this, this.hideTooltip), this.mouseoutHideDelay);
      },

      onTooltipMouseover: function(){
         clearTimeout(this._hideTooltipTimeout);
      },

      onTooltipMouseout: function(){
         this._hideTooltipTimeout = setTimeout(lang.hitch(this, this.hideTooltip), this.mouseoutHideDelay);
      }
   });
});