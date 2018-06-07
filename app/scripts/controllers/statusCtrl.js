'use strict';
var statusCtrl = function($scope, libreService, $translate) {
    var bankAddress = libreService.bank.address,
        getContractData = libreService.methods.getContractData,
        toUnixtime = libreService.methods.toUnixtime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        stateName = libreService.methods.getStateName,
        getLatestBlockData = libreService.methods.getLatestBlockData,
        getNetwork = libreService.methods.getNetwork,
        balanceBank = 0,
        IS_DEBUG = libreService.IS_DEBUG,
        stateMsg = {},
        latestBlockTime = 0;

    $scope.loading = true;

    const ORACLE_ACTUAL = libreService.coeff.oracleActual;

    if (getNetwork() == '') {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    function updateLastBlockTime() {
        getLatestBlockData().then((blockData) => {
            latestBlockTime = parseInt(blockData.data.timestamp, 16);
        });
    }
    updateLastBlockTime();

    ajaxReq.getBalance(bankAddress, function(balanceData) {
        balanceBank = etherUnits.toEther(balanceData.data.balance, 'wei');
    });

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
    }

    $scope.ajaxReq = ajaxReq;

    var oracles = {},
    varsObject = {
        tokenAddress: {
            default: "LibreCash",
            translate: "VAR_tokenAddress",
            process: data => {
              $scope.tokenAddress = data[0];
              return data[0];
            }
        },
        buyRate: {
            default: "Buy Rate",
            translate: "VAR_buyRate",
            process: (data)=>`${normalizeRate(data)} Libre/ETH`
        },
        sellRate: {
            default: "Sell Rate",
            translate: "VAR_sellRate",
            process: (data)=>`${normalizeRate(data)} Libre/ETH`
        },
        buyFee: {
            default: "Buy Fee",
            translate: "VAR_buyFee",
            process: (data) =>`${data/100} %`
        },
        sellFee: {
            default: "Sell Fee",
            translate: "VAR_sellFee",
            process: (data) =>`${data/100} %`
        },
        oracleCount: {
            default: "Oracle Count",
            translate: "VAR_countOracles"
        },
        requestPrice: {
           default:"Request price",
           translate: "VAR_requestPrice", // translate later
           process: (price) => `${etherUnits.toEther(price, 'wei')} ETH`
        },
        getState: {
            default: "State",
            translate: "VAR_contractState",
            process: (state) => stateMsg[stateName(state)]
        },
        requestTime:{
            default: "Request time",
            translate: "VAR_requestTime", //append later
            process: (timestamp)=> timestamp == 0 ? '-' : toUnixtime(timestamp)
        },
        calcTime: {
            default: "Calc time",
            translate: "VAR_calcTime", //append later
            process: (timestamp)=> timestamp == 0 ? '-' : toUnixtime(timestamp)
        }
    };

    $scope.address = bankAddress;
    $scope.tokenAddress = libreService.token.address;
    $scope.contractData = varsObject;

    function translateMSGs() {
      var promises = [];
      for (var state in libreService.coeff.statesENUM) {
        let local_state = state;
        promises.push($translate(`LIBRE_state${state}`).then(msg => {stateMsg[local_state] = msg}));
      }

      return Promise.all(promises);
    }

    const oraclesStruct = {
        name: 0,
        type: 1,
        updateTime: 2,
        enabled: 3,
        waitQuery: 4,
        rate: 5,
        next: 6,
    };

    function getData(varsObject){
        let promises = Object.keys(varsObject).map((key) => getContractData(key));
        return Promise.all(promises);
    }

    function processData(bankData, varsObject) {
        return Promise.resolve(bankData.map(item => {
            let
                varItem = varsObject[item.varName];

            return {
                data: varItem.process ? varItem.process(item.data) : item.data[0],
                translate: varItem.translate,
                default: varItem.default
            };
        }));
    }

    function fillData(varsObject) {
        return getData(varsObject)
                .catch((e) => console.log(e))
                .then((data) => processData(data, varsObject))
                .then((data) => {
                    if (IS_DEBUG) console.log(data);
                    $scope.contractData = data;
                });
    }

    function oracleData(res) {
        let oracle = res.data;

        return Promise.resolve({
            name: hexToString(oracle[oraclesStruct.name]),
            type: hexToString(oracle[oraclesStruct.type]),
            waitQuery: oracle[oraclesStruct.waitQuery],
            updateTime: toUnixtime(oracle[oraclesStruct.updateTime]),
            waiting: oracle[oraclesStruct.waitQuery],
            outdated: oracle[oraclesStruct.waitQuery] &&
                        (+oracle[oraclesStruct.updateTime] + ORACLE_ACTUAL < latestBlockTime),
            rate: normalizeRate(oracle[oraclesStruct.rate]),
            next: oracle[oraclesStruct.next]
        });
    }

    function getOracle(address) {
        return getContractData("getOracleData", [address]).then(oracleData);
    }

    async function fillOracles() {
        let blockData = await getLatestBlockData();
        latestBlockTime = parseInt(blockData.data.timestamp, 16);

        let address = await getContractData("firstOracle"),
            firstOracle = address.data[0],
            oracleAddress = firstOracle,
            oraclesData = [];

        while (oracleAddress !== "0x0000000000000000000000000000000000000000") {
            let oracleInfo = await getOracle(oracleAddress);
            oracleInfo.address = oracleAddress;
            oraclesData.push(oracleInfo);
            oracleAddress = oracleInfo.next;
        }

        $scope.oracles = oraclesData;
        $scope.loading = false;
        applyScope();
    }

    translateMSGs();
    fillData(varsObject);
    fillOracles();

    $scope.copyButton = function(address) {
        const txt = document.createElement('textarea');
        document.body.appendChild(txt);
        txt.value = address; // chrome uses this
        txt.textContent = address; // FF uses this
        var sel = getSelection();
        var range = document.createRange();
        range.selectNode(txt);
        sel.removeAllRanges();
        sel.addRange(range);
        if(document.execCommand('copy')){
          console.log('copied');
        }
        document.body.removeChild(txt);
    }
};
module.exports = statusCtrl;
