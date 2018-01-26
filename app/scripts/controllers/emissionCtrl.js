'use strict';
var emissionCtrl = async function($scope, $sce, walletService, libreService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        bankAbiRefactor = libreService.bank.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        getDataString = libreService.methods.getDataString,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeUnixTimeObject = libreService.methods.normalizeUnixTimeObject,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        getStateName = libreService.methods.getStateName,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasEmission = libreService.coeff.gasEmission,
        universalLibreTransaction = libreService.methods.universalLibreTransaction,
        statusAllowsOrders = libreService.methods.statusAllowsOrders;

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType)
        $scope.notifier.danger(await $translate("LIBREBUY_networkFail"));

    $scope.buyPending = false;
    $scope.tx = {};
    $scope.signedTx;
    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;
    $scope.emissionModal = new Modal(document.getElementById('emission'));
    //walletService.wallet = null;
    //walletService.password = '';
    $scope.allTokens = 'Loading';
    $scope.showAdvance = $rootScope.rootScopeShowRawTx = false;
    $scope.Validator = Validator;
    $scope.gasLimitChanged = false;
    $scope.tx.readOnly = globalFuncs.urlGet('readOnly') == null ? false : true;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;
    $scope.tokenTx = {
        to: '',
        value: 0,
        id: -1
    };
    $scope.customGasMsg = '';

    $scope.customGas = CustomGasMessages;

    $scope.tx = {
        gasLimit: gasEmission,
        data: "",
        to: bankAddress,
        unit: "ether",
        value: "",
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false,
        rateLimit: 0
    }

    $scope.setSendMode = function(sendMode, tokenId = '', tokensymbol = '') {
        $scope.tx.sendMode = sendMode;
        $scope.unitReadable = '';
        if ( globalFuncs.urlGet('tokensymbol') != null ) {
            $scope.unitReadable = $scope.tx.tokensymbol;
            $scope.tx.sendMode = 'token';
        } else if (sendMode == 'ether') {
            $scope.unitReadable = ajaxReq.type;
        } else {
            $scope.unitReadable = tokensymbol;
            $scope.tokenTx.id = tokenId;
        }
        $scope.dropdownAmount = false;
    }

    var applyScope = function() {
        if (!$scope.$$phase) $scope.$apply();
    }

    var defaultInit = function() {
        globalFuncs.urlGet('sendMode') == null ? $scope.setSendMode('ether') : $scope.setSendMode(globalFuncs.urlGet('sendMode'));
        $scope.gasLimitChanged = globalFuncs.urlGet('gaslimit') != null ? true : false;
        $scope.showAdvance = globalFuncs.urlGet('gaslimit') != null || globalFuncs.urlGet('gas') != null || globalFuncs.urlGet('data') != null;
        if (globalFuncs.urlGet('data') || globalFuncs.urlGet('value') || globalFuncs.urlGet('to') || globalFuncs.urlGet('gaslimit') || globalFuncs.urlGet('sendMode') || globalFuncs.urlGet('gas') || globalFuncs.urlGet('tokensymbol')) $scope.hasQueryString = true // if there is a query string, show an warning at top of page

    }

    var setAllTokens = function(data) {
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    };

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
        $scope.tx.to = bankAddress; //walletService.wallet.getAddressString();//$scope.wallet.setTokens();
        if ($scope.parentTxConfig) {
            var setTxObj = function() {
                $scope.addressDrtv.ensAddressField = $scope.parentTxConfig.to;
                $scope.tx.value = $scope.parentTxConfig.value;
                $scope.tx.sendMode = 'ether';
 //               $scope.tx.tokensymbol = $scope.parentTxConfig.tokensymbol ? $scope.parentTxConfig.tokensymbol : '';
                $scope.tx.gasPrice = $scope.parentTxConfig.gasPrice ? $scope.parentTxConfig.gasPrice : null;
                $scope.tx.nonce = $scope.parentTxConfig.nonce ? $scope.parentTxConfig.nonce : null;
                $scope.tx.data = $scope.parentTxConfig.data ? $scope.parentTxConfig.data : $scope.tx.data;
                $scope.tx.readOnly = $scope.addressDrtv.readOnly = $scope.parentTxConfig.readOnly ? $scope.parentTxConfig.readOnly : false;
                if ($scope.parentTxConfig.gasLimit) {
                    $scope.tx.gasLimit = $scope.parentTxConfig.gasLimit;
                    $scope.gasLimitChanged = true;
                }
            }
            $scope.$watch('parentTxConfig', function() {
                setTxObj();
            }, true);
        }
        //$scope.setTokenSendMode();
        defaultInit();
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.setSendMode('ether');
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch('tx', function(newValue, oldValue) {
        $rootScope.rootScopeShowRawTx = false;
    }, true);

    var isEnough = function(valA, valB) {
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    var processBuyRate = function(data) {
        $scope.buyRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 1.1); // -10%
    };

    function updateContractData() {
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = getStateName(data);
        });

        // todo разместить куда-нибудь и протестировать
        Promise.all([
            getBankDataAsync("timeUpdateRequest"),
            getBankDataAsync("queuePeriod")
        ]).then(values => {
            //$scope.now = (+new Date) / 1000; // todo взять из блока
            let _timeUpdateRequest = values[0],
                _queuePeriod = values[1];
            $scope.queuePeriod = _queuePeriod;
            $scope.then = +_timeUpdateRequest.data[0] + +_queuePeriod.data[0];
            $scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
        });

        getBankDataProcess("cryptoFiatRateBuy", processBuyRate);
    }
    updateContractData();

    $scope.generateBuyLibreTx = function() {
        statusAllowsOrders($scope, buyLibreTx);
    }

    var buyLibreTx = function() {
        let rateLimit = Math.round($scope.tx.rateLimit * rateMultiplier);
        $scope.tx.data = getDataString(bankAbiRefactor["createBuyOrder"],
            [$scope.wallet.getAddressString(), rateLimit]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasEmission;

        universalLibreTransaction($scope, "buyPending", "BUY", $translate, updateContractData);
    }

    $scope.transferAllBalance = function() {
        uiFuncs.transferAllBalance($scope.wallet.getAddressString(), $scope.tx.gasLimit, function(resp) {
            if (!resp.isError) {
                $scope.tx.unit = resp.unit;
                $scope.tx.value = resp.value;
            } else {
                $rootScope.rootScopeShowRawTx = false;
                $scope.notifier.danger(resp.error);
            }
        });
    }
};
module.exports = emissionCtrl;
