'use strict'
var globalService = function($http, $httpParamSerializerJQLike) {

  globalFuncs.checkAndRedirectHTTPS()
  ajaxReq.http = $http
  ajaxReq.postSerializer = $httpParamSerializerJQLike
  ajaxReq.getETHvalue = nodes.ethPrice.getETHvalue
  ajaxReq.getRates = nodes.ethPrice.getRates

  var tabs = {
  generateWallet: {
    id: 0,
    name: "NAV_GenerateWallet_alt",
    url: "generate-wallet",
    mew: true,
    cx: false
  },
  myWallet: {
    id: 1,
    name: "NAV_MyWallets",
    url: "my-wallet",
    mew: false,
    cx: true
  },
  addWallet: {
    id: 2,
    name: "NAV_AddWallet",
    url: "add-wallet",
    mew: false,
    cx: true
  },
  sendTransaction: {
    id: 3,
    name: "NAV_SendEther",
    url: "send-transaction",
    mew: true,
    cx: true
  },
  contracts: {
    id: 4,
    name: "NAV_Contracts",
    url: "contracts",
    mew: false,
    cx: false
  },
  ens: {
    id:5,
    name: "NAV_ENS",
    url: "ens",
    mew: true,
    cx: true
  },
  domainsale: {
    id: 6,
    name: "NAV_DomainSale",
    url: "domainsale",
    mew: true,
    cx: true
  },
  signMsg: {
    id: 7,
    name: "NAV_SignMsg",
    url: "sign-message",
    mew: false,
    cx: false
  },
  bulkGenerate: {
    id: 8,
    name: "NAV_BulkGenerate",
    url: "bulk-generate",
    mew: false,
    cx: false
  },
  emission: {
    id: 9,
    name: "NAV_Exchange",
    url: "exchange",
    mew: true,
    cx: true
  },
  status: {
    id: 10,
    name: "NAV_Status",
    url: "status",
    mew: true,
    cx: true
  }
  }

  var currentTab = 0
  if(typeof chrome != 'undefined')
    currentTab = chrome.windows === undefined ? 0 : 3
  return {
    tabs: tabs,
    currentTab: currentTab
  }

  var tokensLoaded = false

}

module.exports = globalService


