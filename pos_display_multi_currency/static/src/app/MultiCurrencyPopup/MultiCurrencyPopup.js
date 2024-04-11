/** @odoo-module */
/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { Component } from "@odoo/owl";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";

export class WkDisplaycCurrmultiPopup extends AbstractAwaitablePopup {
    static template = "pos_display_multi_currency.WkDisplaycCurrmultiPopup";
    static defaultProps = {
        title: 'Confirm ?'
        , value: ''
    }
    setup() {
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        super.setup();
    }
    get selected_currency() {
        return this.props.selected_currency
    }
    wk_change_currency(e) {
        var self = this;
        var sel_curr_data;
        var sel_curr_id = $('#wk_currencies').children(":selected").attr("id");
        if (sel_curr_id)
            sel_curr_data = self.env.services.pos.db.wk_display_curr_ids.filter(curr => curr.id == sel_curr_id);
        if (sel_curr_data && sel_curr_data[0] && sel_curr_data.length == 1) {
            self.pos.currency = sel_curr_data[0];
            var order = self.pos.get_order();
            self.props.selected_currency = sel_curr_data[0];
            if (order) {
                order.get_orderlines().forEach(line => {
                    line.set_unit_price(line.prev_price / self.env.services.pos.currency.rate);
                    line.price_manually_set = true;
                });
            }
            const res = this.orm.call(
                'pos.config',
                'set_selected_currency',
                [1, self.pos.currency.id, self.pos.config.id],
            )
            if (res) {
                self.cancel();
            }
        }
    }
};

export class WKMultiCurrButton extends Component {
    static template = "point_of_sale.WKMultiCurrButton";
    setup() {
        this.pos = usePos();
        this.popup = useService("popup");
        super.setup();
    }
    async onClick() {
        var self = this;
        self.popup.add(WkDisplaycCurrmultiPopup,
            { selected_currency: self.pos.currency.name })
    }
    get currentCurrencyName() {
        return this.pos.currency ? this.pos.currency.name : _t('Multi Currencies');
    }
}
ProductScreen.addControlButton({
    component: WKMultiCurrButton,
    condition: function () {
        return this.pos.config.enable_display_multi_curr;
    },
});