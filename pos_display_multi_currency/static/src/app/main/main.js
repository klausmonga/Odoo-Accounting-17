/** @odoo-module */
/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { PaymentScreenStatus } from "@point_of_sale/app/screens/payment_screen/payment_status/payment_status";
import { ClosePosPopup } from "@point_of_sale/app/navbar/closing_popup/closing_popup";
import { MoneyDetailsPopup } from "@point_of_sale/app/utils/money_details_popup/money_details_popup";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { PaymentScreenPaymentLines } from "@point_of_sale/app/screens/payment_screen/payment_lines/payment_lines";
import { Product } from "@point_of_sale/app/store/models";
import { Order, Orderline } from "@point_of_sale/app/store/models";
import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";
import { onMounted } from "@odoo/owl";
import { roundDecimals as round_di, floatIsZero } from "@web/core/utils/numbers";
import { _t } from "@web/core/l10n/translation";
import { formatFloat } from "@web/core/utils/numbers";

patch(ReceiptScreen.prototype, {
    setup() {
        var self = this;
        self.env.services.pos.get_order().for_orderline = false;
        super.setup()
    },
    get orderAmountPlusTip() {
        const order = this.currentOrder;
        var currAmt;
        const orderTotalAmount = order.get_total_with_tax();
        const tip_product_id = this.pos.config.tip_product_id && this.pos.config.tip_product_id[0];
        const tipLine = order
            .get_orderlines()
            .find((line) => tip_product_id && line.product.id === tip_product_id);
        var tipAmount = tipLine ? tipLine.get_all_prices().priceWithTax : 0;
        const orderAmountStr = this.env.utils.formatCurrency(orderTotalAmount - tipAmount);
        if (this.pos.config.enable_display_multi_curr) {
            currAmt = this.pos.wk_format_currency(order.prev_total);
            if (!tipAmount) {
                return `${orderAmountStr}/${currAmt}`;
            }
            tipAmount = (tipAmount / this.pos.currency.rate);
            const tipAmountStr = this.pos.wk_format_currency(tipAmount);
            return `${orderAmountStr}/${currAmt} + ${tipAmountStr} tip`;
        } else {
            if (!tipAmount) return orderAmountStr;
            const tipAmountStr = this.env.utils.formatCurrency(tipAmount);
            return `${orderAmountStr} + ${tipAmountStr} tip`;
        }
    }
});

patch(PaymentScreenStatus.prototype, {
    get order_default_total() {
        return this.wk_order_total();
    },
    wk_order_total() {
        var self = this;
        var order = self.env.services.pos.get_order();
        var pos = this.env.services.pos;
        if (order) {
            var lines = order.get_orderlines();
            var total = 0;
            lines.forEach(line => {
                const taxes =pos.get_taxes_after_fp(line.product.taxes_id, order && order?.fiscal_position);
                var price = pos.compute_all(taxes, line.prev_price, 1, pos.currency?.rounding);
                total = total + (price?.total_included * line.quantity);
            });
            order.prev_total = total;
            return total;
        }
    },
    get changeText() {
        var pos = this.env.services.pos;
        var curr_res, res = 0.00;
        res = this.env.utils.formatCurrency(this.props.order.get_change());
        if (pos.config.show_currency_on_payment_status) {
            var change = (this.props.order.get_change() / pos.currency.rate);
            curr_res = pos.wk_format_currency(change);
            return {
                curr_res: curr_res,
                res: res,
            }
        } else {
            return res;
        }
    },
    get totalDueText() {
        var order = this.env.services.pos.get_order();
        var curr_res, res = 0.00;
        res = this.env.utils.formatCurrency(
            this.props.order.get_total_with_tax() + this.props.order.get_rounding_applied()
        );
        var total = this.wk_order_total();
        if (this.env.services.pos.config.show_currency_on_payment_status) {
            curr_res = this.env.services.pos.wk_format_currency(
                total + this.props.order.get_rounding_applied()
            );
            if (order) {
                order.default_total = curr_res;
                order.default_total_curr = res;
            }
            if (order.get_paymentlines().length > 0) {
                return {
                    curr_res: curr_res,
                    res: res,
                }
            } else {
                return curr_res + '/' + res;
            }
        } else {
            return res;
        }
    },
    get remainingText() {
        var pos = this.env.services.pos;
        var order = pos.get_order();
        var curr_res, res = 0.00;
        res = this.env.utils.formatCurrency(
            this.props.order.get_due() > 0 ? this.props.order.get_due() : 0
        );
        if (pos.config.show_currency_on_payment_status) {
            var due = (this.props.order.get_due() / pos.currency.rate);
            curr_res = pos.wk_format_currency(
                due > 0 ? due : 0
            );
            if (order) {
                order.remain_amt = res;
                order.remain_amt_curr = curr_res;
                return {
                    curr_res: curr_res,
                    res: res,
                }
            }
        } else {
            return res;
        }
    }
});

patch(ClosePosPopup.prototype, {
    setup() {
        super.setup();
        this.currency = this.pos.db.company_currency;
    }
});

patch(MoneyDetailsPopup.prototype, {
    setup() {
        super.setup();
        this.currency = this.pos.db.company_currency;
    }
});

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();
        onMounted(this.WkOnMounted);
    },
    WkOnMounted() {
        var order = this.pos.get_order();
        if (order.get_paymentlines().length === 0 && order?.default_total) {
            $('.paymentlines-empty .total').replaceWith(`
            <div class="total">
            ${order?.default_total}/ <span class="wk_display_curr" style="font-size: 50px;" >${order?.default_total_curr}</span>
            </div>
            `);
        }
    },
    deletePaymentLine(event) {
        super.deletePaymentLine(event);
        var order = this.pos.get_order();
        if (order.get_paymentlines().length === 0) {
            $('.paymentlines-empty .total').replaceWith(`
            <div class="total">
            ${order?.default_total}/ <span class="wk_display_curr" >${order?.default_total_curr}</span>
            </div>
            `);
        }
    }
});

patch(PaymentScreenPaymentLines.prototype, {
    get currency_amount() {
        if (this.line.pos.config.show_currency_on_payment_lines) {
            var order_total = this.pos.get_order().get_total_with_tax();
            var line_amt_curr = (this.line.order.prev_total / order_total) * this.line.amount;
            return this.env.services.pos.wk_format_currency(
                (line_amt_curr).toFixed(2)
            );
        }
    }
});

patch(Product.prototype, {
    getFormattedUnitPrice() {
        try {
            var pos = this.env.services.pos;
            if (pos.config.enable_display_multi_curr && pos.config.show_currency_on_product) {
                var wk_amount;
                var amount = this?.get_display_price(this.pricelist, 1);
                if (pos.currency && pos.prev_currency)
                    wk_amount = (amount / pos.currency.rate);
                var formattedUnitPrice = pos.wk_format_currency(
                    amount,
                    'Product Price'
                );
                var wkformattedUnitPrice =  wk_amount.toFixed(2);
                if (this.to_weight) {
                    return `${wkformattedUnitPrice}(${formattedUnitPrice})/${pos.units_by_id[this.uom_id[0]].name
                        }`;
                } else {
                    return {
                        wkformattedUnitPrice: `${wkformattedUnitPrice}`,
                        formattedUnitPrice: `${formattedUnitPrice}`,
                    }
                }
            } else {
                const formattedUnitPrice = this.env.utils.formatCurrency(
                    this.get_display_price(this.pricelist, 1),
                    'Product Price'
                );
                if (this.to_weight) {
                    return `${formattedUnitPrice}/${pos.units_by_id[this.uom_id[0]].name
                        }`;
                } else {
                    return super.getFormattedUnitPrice()
                }
            }
        } catch (error) {
            console.log("error:", error)
        }
      
    }
});

patch(Orderline.prototype, {
    setup(options) {
        super.setup(...arguments);
        this.display_curr_change = this.display_curr_change || false;
        this.prev_price = this.prev_price || false;
        if( this.get_all_prices() && this.get_all_prices().priceWithTax){
            this.wk_price_with_tax = this.prev_price || false;
        }
        if(this.get_all_prices() && this.get_all_prices().priceWithoutTax){
            this.wk_price_without_tax = this.get_all_prices().priceWithoutTax || false;
        }

    },
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        if (json.display_curr_change)
            this.display_curr_change = json.display_curr_change
        if (json.prev_price)
            this.prev_price = json.prev_price
        if (json.wk_price_with_tax)
            this.wk_price_with_tax = json.wk_price_with_tax;
        if (this.wk_price_without_tax)
            this.wk_price_without_tax = json.wk_price_without_tax;
    },
    export_as_JSON() {
        var json = super.export_as_JSON(...arguments);
        var current_order = this;
        if (current_order != null) {
            json.display_curr_change = current_order.display_curr_change;
            json.prev_price = current_order.prev_price;
            json.wk_price_with_tax = current_order.wk_price_with_tax;
            json.wk_price_without_tax = current_order.wk_price_without_tax;
        }
        return json;
    },
    can_be_merged_with(orderline) {
        var self = this;
        var price = parseFloat(round_di(this.price || 0, this.pos.dp['Product Price']).toFixed(this.pos.dp['Product Price']));
        var order_line_price = orderline.get_product().get_price(orderline.order.pricelist, this.get_quantity());
        order_line_price = round_di(
            orderline.compute_fixed_price(order_line_price),
            this.pos.currency.decimal_places
        );
        // ---added---code-----
         if (self.pos.config.enable_display_multi_curr) {
             order_line_price = (order_line_price / self.pos.currency.rate);
         }
        // ----end---of---code
        order_line_price = round_di(orderline.compute_fixed_price(order_line_price), this.pos.currency.decimal_places);
        // only orderlines of the same product can be merged
        return (
            !this.skipChange &&
            orderline.getNote() === this.getNote() &&
            this.get_product().id === orderline.get_product().id &&
            this.get_unit() &&
            this.is_pos_groupable() &&
            // don't merge discounted orderlines
            this.get_discount() === 0 &&
            floatIsZero(
                price - order_line_price - orderline.get_price_extra(),
                this.pos.currency.decimal_places
            ) &&
            !(
                this.product.tracking === "lot" &&
                (this.pos.picking_type.use_create_lots || this.pos.picking_type.use_existing_lots)
            ) &&
            this.full_product_name === orderline.full_product_name &&
            orderline.get_customer_note() === this.get_customer_note() &&
            !this.refunded_orderline_id &&
            !this.isPartOfCombo() &&
            !orderline.isPartOfCombo()
        );
    },
    set_unit_price(price) {
        var self = this;
        var result = super.set_unit_price(...arguments)
        if (!self.display_curr_change) {
            self.prev_price = self.product.lst_price;
            this.price = (self.product.lst_price / self.env.services.pos.currency.rate);
        }
        return result
    },
    getDisplayData() {
        var self=this;
        return {
            ...super.getDisplayData(),
            prev_price:  self.product.lst_price,
        };
    }
});
patch(Order.prototype, {
    setup(options) {
        var self = this;
        super.setup(...arguments);
        self.prev_total = self.prev_total || null;
        self.default_total = self.default_total || null;
        self.default_total_curr = self.default_total_curr || null;
        self.wk_change = self.wk_change || null;
        self.wk_change_curr = self.wk_change_curr || null;
        self.remain_amt = self.remain_amt || null;
        self.remain_amt_curr = self.remain_amt_curr || null;
        self.for_orderline = self.for_orderline || true;

    },
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        if (json.prev_total) {
            this.prev_total = json.prev_total;
            this.default_total = json.default_total || null;
            this.default_total_curr = json.default_total_curr || null;
            this.wk_change = json.wk_change || null;
            this.wk_change_curr = json.wk_change_curr || null;
            this.remain_amt = json.remain_amt || null;
            this.remain_amt_curr = json.remain_amt_curr || null;
            this.for_orderline = json.for_orderline || null;
        }
    },
    export_as_JSON() {
        var json = super.export_as_JSON(...arguments);
        if (this) {
            json.prev_total = this.prev_total;
            json.default_total = this.default_total;
            json.default_total_curr = this.default_total_curr;
            json.wk_change = this.wk_change;
            json.wk_change_curr = this.wk_change_curr;
            json.remain_amt = this.remain_amt;
            json.remain_amt_curr = this.remain_amt_curr;
            json.for_orderline = this.for_orderline;
        }
        return json;
    },
    export_for_printing() {
        var self = this;
        var dict = super.export_for_printing(...arguments);
        dict.prev_total = self.prev_total;
        return dict;
    },
});

patch(PosStore.prototype, {
    wk_format_currency(amount, precision) {
        if (this.db.company_currency?.position === 'after') {
            return amount + ' ' + (this.db.company_currency?.symbol || '');
        } else {
            return (this.db.company_currency?.symbol || '') + ' ' + amount;
        }
    },
    format_currency_no_symbol(amount, precision, currency) {
        if (amount) {
            let line_amount = parseFloat(amount.match(/\d+(\.\d+)?/)[0]);
            if (!currency) {
                currency = this.currency
            }
            var decimals = currency.decimal_places;
    
            if (precision && this.dp[precision] !== undefined) {
                decimals = this.dp[precision];
            }
            
            if (typeof line_amount === 'number') {
                line_amount = round_di(line_amount, decimals).toFixed(decimals);
                line_amount = formatFloat(round_di(line_amount, decimals), {
                    digits: [69, decimals],
                });
            }
            if (this.currency?.position === 'after') {
                return line_amount + ' ' + (this.currency?.symbol || '');
            } else {
                return (this.currency?.symbol || '') + ' ' + line_amount;
            }
        }
    },
    _save_to_server(orders, options) {
        var self = this;
        if (!orders || !orders.length) {
            return Promise.resolve([]);
        }
        this.set_synch('connecting', orders.length);
        options = options || {};
        var timeout = typeof options.timeout === 'number' ? options.timeout : 30000 * orders.length;
        var order_ids_to_sync = orders.map(order => order.id);
        var args = [orders.map(order => {
            order.to_invoice = options.to_invoice || false;
            return order;
        })];
        args.push(options.draft || false);

        // added code
        if (self.config.enable_display_multi_curr) {
            let wk_orders = args[0];
            wk_orders.forEach(order => {
                var lines = order.data.lines;
                lines.forEach(line => {
                    line[2].price_unit = line[2].prev_price;
                    line[2].price_subtotal = line[2].wk_price_without_tax;
                    line[2].price_subtotal_incl = line[2].wk_price_with_tax;
                })
                order.data.amount_total = order.data.prev_total;
            })
        }
        // end code
        const server_ids = this.env.services.orm.silent.call(
            'pos.order',
            'create_from_ui',
            args,
        )
        if (server_ids) {
            try {
                order_ids_to_sync.forEach(order_id => {
                    self.db.remove_order(order_id);
                });
                self.failed = false;
                self.set_synch('connected');
                return server_ids;
            }
            catch (error) {
                if (error.code === 200) {    // Business Logic Error, not a connection problem
                    // Hide error if already shown before ...
                    if ((!self.failed || options.show_error) && !options.to_invoice) {
                        self.failed = error;
                        self.set_synch('error');
                        throw error;
                    }
                }
                self.set_synch('disconnected');
                throw error;
            }
        };
    },
    async _processData(loadedData) {
        await super._processData(...arguments);
        var self = this;
        const data = await this.env.services.orm.silent.call(
            'res.currency',
            'get_wk_display_currencies_data',
            [1, self.config.id],
        )
        if (data) {
            try {
                // sets default currency as the one selected in pos config
                self.prev_currency = self.currency;
                self.db.company_currency = data['company_currency'];
                if (!data['wk_sel_currency']) {
                    self.currency = data['default_currency'];
                }
                else {
                    self.currency = data['multi_currencies'].filter((curr) => curr.id === data['wk_sel_currency'])[0];
                }
                self.db.wk_display_curr_ids = data['multi_currencies'];
            } catch (error) {
                console.log("error:", error);
            }
        }
    }
});