/** @odoo-module */
/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */

import { OrderWidget } from "@point_of_sale/app/generic_components/order_widget/order_widget";
import { patch } from "@web/core/utils/patch";

patch(OrderWidget.prototype, {
    get total_dis_curr_price() {
        var pos = this.env.services.pos;
        if (this.env.services.pos.orders) {
            var lines = this.env.services.pos.get_order().get_orderlines();
            var total = 0;
            lines.forEach(line => {
                $('.orderline .price').addClass('wk_display_curr');
                const taxes =pos.get_taxes_after_fp(line.product.taxes_id, this.env.services.pos.orders && this.env.services.pos.orders?.fiscal_position);
                var price = pos.compute_all(taxes, line.prev_price, 1, pos.currency?.rounding);
                total = total + (price?.total_included  * line.quantity)
            });
            this.env.services.pos.orders.order_total = total
            return total.toFixed(2);
        }
    }
});