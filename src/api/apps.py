from urllib import request, error as ulError
from django.apps import AppConfig
import tensorflow as tf
from tensorflow import feature_column
from tensorflow.keras import layers
from django.conf import settings
import os
import pandas as pd
import numpy as np
import sys
import json
if sys.version_info[0] < 3: 
    from StringIO import StringIO
else:
    from io import StringIO


class ApiConfig(AppConfig):
    name = 'api'

API_ADDR_URL = "https://api.blockcypher.com/v1/btc/main/addrs/"

class AddressAnalyser:
    def __init__(self, address):
        self.status = ""
        self.address = address
        self.__addr_json = self.__get_json()
        if self.__addr_json == None:
            return
        if self.__addr_json != False:
            self.n_tx = self.__addr_json["n_tx"] # Total number of transactions.
            if self.n_tx > 0:
                self.n_rtx = 0 # Total recieved transactions.
                self.n_stx = 0 # Total sent transactions.
                self.recieved_tx_hashes = [] # Distinct recieved transaction hashes.
                self.sent_tx_hashes = [] # Distinct sent transaction hashes.

                self.__get_tx_vals("sent")
                self.__get_tx_vals("recieved")
                self.status = "completed"
            else:
                self.status = "completed"


    def __get_json(self):
        req = request.Request(API_ADDR_URL+self.address)
        req.add_header('User-Agent', 'Magic Browser')
        try:
            data = request.urlopen(req).read()
            json_response = json.loads(data)
            return json_response
        except ulError.HTTPError as error:
            print("Failed with HTTP Error {}".format(error))
            if error.code == 429:
                print("Rate limit exceeded, restart the script on the next hour.")
                self.status = "rate_limit_exceeded"


    def __get_tx_vals(self, tx_type):
        tx_val_list = []
        if tx_type == "recieved":
            tx_type = "tx_output_n"
        if tx_type == "sent":
            tx_type = "tx_input_n"

        try:
            for tx in self.__addr_json["txrefs"]:
                if tx[tx_type] != -1:

                    if tx_type == "tx_input_n":
                        self.n_stx += 1
                        if tx["tx_hash"] not in self.sent_tx_hashes:
                            self.sent_tx_hashes.append(tx["tx_hash"])
                    if tx_type == "tx_output_n":
                        self.n_rtx += 1
                        if tx["tx_hash"] not in self.recieved_tx_hashes:
                            self.recieved_tx_hashes.append(tx["tx_hash"])

                    tx_val_list.append(tx["value"])
            
            return tx_val_list
        except KeyError:
            raise ValueError

class Evaluate:
    def __init__(self, n_stx, n_rtx, sent_tx_hashes, rcvd_tx_hashes):
        
        print(rcvd_tx_hashes)

        self.model = tf.keras.models.load_model(os.path.join(settings.BASE_DIR, "api/models/267-0.82/"))

        n_stx = tf.constant([n_stx], name='n_stx', dtype=tf.int32, shape=(1,))
        n_rtx = tf.constant([n_rtx], name='n_rtx', dtype=tf.int32, shape=(1,))
        sent_tx_hashes = tf.constant([sent_tx_hashes], name='total_sent_hashes', dtype=tf.int32, shape=(1,))
        rcvd_tx_hashes = tf.constant([rcvd_tx_hashes], name='total_recieved_hashes', dtype=tf.int32, shape=(1,))

        d = {'n_stx': n_stx, 'n_rtx': n_rtx, 'total_sent_hashes': sent_tx_hashes, 'total_recieved_hashes': rcvd_tx_hashes}

        prediction = self.model.predict(d, steps=1, verbose=1, batch_size=128)

        self.prediction = int(round(prediction[0][0]*100))

    def set_feature_columns(self, column_list):
        for header in column_list:
            self.feature_columns.append(
                feature_column.numeric_column(header)
            )