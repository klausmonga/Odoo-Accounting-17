/** @odoo-module */
/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */

import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { patch } from "@web/core/utils/patch";

patch(Orderline.prototype, {
    get line_price() {
        var self = this;
        var pos=self.env.services.pos
        var order =pos.get_order();
        order.order_total;
        var price;
        if (order) {
            order.get_orderlines().forEach(line => {
                const taxes =pos.get_taxes_after_fp(line.product.taxes_id, order && order?.fiscal_position);
                price = pos.compute_all(taxes, self.props.line.prev_price, 1,pos.currency?.rounding);
            });
        }
        return price?.total_included  * this.props.line.qty;
    },
  
});