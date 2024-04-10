# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#   See LICENSE file for full copyright and licensing details.
#   License URL : <https://store.webkul.com/license.html/>
# 
#################################################################################
from odoo import fields,api,models

class PosOrder(models.Model):
    _inherit = "pos.order"

    prev_total = fields.Float()

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        res = super(PosOrder,self)._payment_fields(order, ui_paymentline)
        res.update({'amount': order.prev_total or 0.0 })
        return res

    @api.model
    def _order_fields(self,ui_order):
        res = super(PosOrder,self)._order_fields(ui_order)
        res.update({'prev_total':ui_order.get('prev_total')})
        return res

class PosConfig(models.Model):
    _inherit = 'pos.config'
    enable_display_multi_curr = fields.Boolean('Enable Multi Currency',default=True)
    wk_default_currency_id = fields.Many2one('res.currency','Default Currency')
    wk_multi_currency_ids = fields.Many2many(
        "res.currency",relation="disp_res_curr_rel" ,string="Multiple Currencies")
    wk_sel_int_currency = fields.Integer('Selected Currency')
    show_currency_on_product = fields.Boolean('Show currency on Product',default=True)
    show_currency_on_orderline = fields.Boolean('Show currency on Orderline',default=True)
    show_currency_on_total = fields.Boolean('Show currency on Total',default=True)
    show_currency_on_payment_lines = fields.Boolean('Show currency on Payment Lines',default=True)
    show_currency_on_payment_status = fields.Boolean('Enable currency on Payment Status',default=True)

    def set_selected_currency(self,currency_id,config_id):
        config = self.env['pos.config'].browse(config_id)
        config.write({
            'wk_sel_int_currency':currency_id
        })
        return True 

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    
    pos_wk_default_currency_id = fields.Many2one(related='pos_config_id.wk_default_currency_id', readonly=False)
    pos_enable_display_multi_curr = fields.Boolean(related='pos_config_id.enable_display_multi_curr', readonly=False)
    pos_wk_multi_currency_ids = fields.Many2many(related='pos_config_id.wk_multi_currency_ids', readonly=False)
    pos_show_currency_on_product = fields.Boolean(related='pos_config_id.show_currency_on_product', readonly=False)
    pos_show_currency_on_orderline = fields.Boolean(related='pos_config_id.show_currency_on_orderline', readonly=False)
    pos_show_currency_on_total = fields.Boolean(related='pos_config_id.show_currency_on_total', readonly=False)
    pos_show_currency_on_payment_lines = fields.Boolean(related='pos_config_id.show_currency_on_payment_lines', readonly=False)
    pos_show_currency_on_payment_status = fields.Boolean(related='pos_config_id.show_currency_on_payment_status', readonly=False)

class ResCurrency(models.Model):
    _inherit = 'res.currency'

    def get_wk_display_currencies_data(self,config_id):
        wk_sel_currency = self.env['pos.config'].browse(
            config_id).wk_sel_int_currency
        currency_ids = self.env['res.config.settings'].search(
            []).pos_wk_multi_currency_ids
        default_id = self.env['res.config.settings'].search(
            []).pos_wk_default_currency_id
        company_currency = self.env['pos.config'].browse(
            config_id).company_id.currency_id
        
        curr_data = {
            "company_currency":{
                "decimal_places" : company_currency.decimal_places,
                "id":company_currency.id,
                "name":company_currency.name,
                "position" : company_currency.position,
                "rate":company_currency.rate,
                "rounding":company_currency.rounding,
                "symbol":company_currency.symbol,
            },
            "default_currency" : {
                "decimal_places" : default_id.decimal_places,
                "id":default_id.id,
                "name":default_id.name,
                "position" : default_id.position,
                "rate":default_id.rate,
                "rounding":default_id.rounding,
                "symbol":default_id.symbol,
            }
        }
        data = []
        for curr_id in currency_ids:
            currency_dict = {
                "decimal_places" : curr_id.decimal_places,
                "id":curr_id.id,
                "name":curr_id.name,
                "position" : curr_id.position,
                "rate":curr_id.rate,
                "rounding":curr_id.rounding,
                "symbol":curr_id.symbol,
            }
            data.append(currency_dict)
        curr_data['multi_currencies'] = data
        curr_data['wk_sel_currency'] = wk_sel_currency
        return curr_data
    
    def name_get(self):
        result = []
        for rec in self:
            rate = "{:.3f}".format(rec.rate)
            result.append((rec.id, '%s ( %s )' % (rec.name,rate)))
        return result