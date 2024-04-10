# -*- coding: utf-8 -*-
#################################################################################
# Author      : Webkul Software Pvt. Ltd. (<https://webkul.com/>)
# Copyright(c): 2015-Present Webkul Software Pvt. Ltd.
# All Rights Reserved.
#
#
#
# This program is copyright property of the author mentioned above.
# You can`t redistribute it and/or modify it.
#
#
# You should have received a copy of the License along with this program.
# If not, see <https://store.webkul.com/license.html/>
#################################################################################
{
    "name"          :   "POS Display Multi Currency",
    "summary"       :   """The module allows you to show currency in POS and change its currency inside the POS.POS Currency|POS Multi Currency|POS Multiple currencies""",
    "category"      :   "Point of Sale",
    "version"       :   "1.0.1",
    "sequence"      :   1,
    "author"        :   "Webkul Software Pvt. Ltd.",
    "license"       :   "Other proprietary",
    "website"       :   "https://store.webkul.com/",
    "description"   :   """POS Multi Currency
                            POS Multiple currencies
                            POS Currency Multiple
                            POS Extra Currency
                            POS Currency
                        """,
    "live_test_url" :   "http://odoodemo.webkul.com/?module=pos_display_multi_currency&custom_url=/pos/auto/#action=pos.ui",
    "depends"       :   ['point_of_sale'],
    "data"          :   [
                            'views/pos_config_view.xml',
                        ],
    "demo"          :   ['data/pos_data.xml'],
    "application"   :   True,
    "installable"   :   True,
    "assets"        :   {
                            'point_of_sale._assets_pos': [
                                'pos_display_multi_currency/static/src/**/*',
                            ],
                        },
    "images"        :   ['static/description/Banner.png'],
    "auto_install"  :   False,
    "price"         :   49,
    "currency"      :   "USD",
    "pre_init_hook" :   "pre_init_check",
}