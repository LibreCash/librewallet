<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>
    <div class="row justify-content-md-center">

        <div class="tab-content__inner">
            <nav class="bank-status-nav">
                <ul class="bank-status-nav__list">
                    <li class="bank-status-nav__item {{ showOracles ? '' : 'active' }}" ng-click="showOracles=!showOracles"><a translate="BANKSTATUS_contractStatus">Contract status</a></li>
                    <li class="bank-status-nav__item {{ showOracles ? 'active' : '' }}" ng-click="showOracles=!showOracles"><a translate="BANKSTATUS_oraclesStatus">Oracles</a></li>
                </ul>
            </nav>
        </div>

        <div class="col-lg-12 bank-status__wrapper" ng-hide="showOracles">
            <div class="contract-status">

                <div class="contract-status__BCA">
                    <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank" rel="noopener noreferrer" class="contract-status__BCA-link">
                        {{ address }}
                    </a>
                    <p translate="BANKSTATUS_bankContractAddress" class="contract-status__BCA-bottom">Bank contract address</p>
                    <button class="contract-status__copy-btn">copy</button>
                </div>
                <div class="contract-status__LCC">
                    <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', tokenAddress) }}" target="_blank" rel="noopener noreferrer" class="contract-status__BCA-link">
                        {{ tokenAddress }}
                    </a>
                    <p translate="VAR_tokenAddress" class="contract-status__BCA-bottom">LibreCash Contract</p>
                    <button class="contract-status__copy-btn">copy</button>
                </div>

                <div class="contract-status__table">
                    <div ng-hide="(data.data.indexOf('0x') == 0) && (data.data.length == 42)" ng-repeat="data in contractData" class="contract-status__table-item">
                        <div class="contract-status__table-item-data">{{ data.data }}</div>
                        <div translate="{{ data.translate }}" class="contract-status__table-item-name">{{ data.default }}</div>
                    </div>
                </div>
            </div>
        </div>   
        <div class="col-lg-12" ng-show="showOracles">
            <!-- <h1 translate="BANKSTATUS_oraclesStatus">Oracles status</h1> -->
            <table class="table">
                <thead>
                <tr>
                    <th translate="BANKSTATUS_address">Address</th>
                    <th translate="BANKSTATUS_name">Name</th>
                    <th translate="BANKSTATUS_type">Type</th>
                    <th translate="BANKSTATUS_updateTime">Update Time</th>
                    <th translate="BANKSTATUS_rate">Rate</th>
                </tr>
                <tr ng-repeat="oracle in oracles">
                    <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', oracle.address) }}" target="_blank"
                     rel="noopener noreferrer">{{ oracle.address | limitTo: 15 }}&hellip;</a></td>
                    <td>{{ oracle.name }}</td>
                    <td>{{ oracle.type }}</td>
                    <td>{{ oracle.updateTime }}</td>
                    <td>{{ oracle.rate }}</td>
                </tr>
                </thead>
            </table>
        </div>
    </div>
</main>
<!-- / Bank Status Page -->
