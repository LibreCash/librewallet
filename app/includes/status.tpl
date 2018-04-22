<!-- Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.status.id" ng-controller='statusCtrl' ng-cloak>
    <div class="row justify-content-md-center">

        <section class="loading-wrap" ng-show="loading" ng-click="loading = false">
            <div class="loading">
            <h1> Loading... </h1>
            </div>
        </section>

        <section ng-hide="loading">

            <div class="tab-content__inner">
                <nav class="bank-status-nav">
                    <ul class="bank-status-nav__list">
                        <li class="bank-status-nav__item {{ showOracles ? '' : 'active' }}" ng-click="showOracles=!showOracles"><a translate="LIBRESTATUS_contractStatus">Contract status</a></li>
                        <li class="bank-status-nav__item {{ showOracles ? 'active' : '' }}" ng-click="showOracles=!showOracles"><a translate="LIBRESTATUS_oraclesStatus">Oracles</a></li>
                    </ul>
                </nav>
            </div>

            <div class="col-lg-12 bank-status__wrapper" ng-hide="showOracles">
                <h1 translate="LIBRESTATUS_contractStatus">Contract Status</h1>
                <div class="contract-status">

                <div class="contract-status__BCA">
                    <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank" rel="noopener noreferrer" class="contract-status__BCA-link">
                        {{ address }}
                    </a>
                    <p translate="LIBRESTATUS_bankContractAddress" class="contract-status__BCA-bottom">Exchanger contract</p>
                    <button class="contract-status__copy-btn" ng-click="copyButton(address)">copy</button>
                </div>

                <div class="contract-status__LCC">
                    <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', tokenAddress) }}" target="_blank" rel="noopener noreferrer" class="contract-status__BCA-link">
                        {{ tokenAddress }}
                    </a>
                    <p translate="VAR_tokenAddress" class="contract-status__BCA-bottom">LibreCash contract</p>
                    <button class="contract-status__copy-btn" ng-click="copyButton(tokenAddress)">copy</button>
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
                <h1 translate="LIBRESTATUS_oraclesStatus">Oracles status</h1>
                <table class="table oracles-table">
                    <thead>
                    <tr>
                        <th translate="LIBRESTATUS_name">Name</th>
                        <!--th translate="LIBRESTATUS_type">Type</th-->
                        <th translate="LIBRESTATUS_updateTime">Update Time</th>
                        <th translate="LIBRESTATUS_rate">Rate</th>
                    </tr>
                    </thead>
                    
                    <tr ng-repeat="oracle in oracles">
                        <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', oracle.address) }}" target="_blank">{{ oracle.name }}</a></td>
                        <td>{{ oracle.updateTime }}</td>
                        <td>{{ oracle.outdated ? 'outdated' : (oracle.waiting ? ('LIBRE_waiting' | translate) : oracle.rate + ' Libre/ETH' ) }}</td>
                    </tr>
                </table>
            </div>
        </section>
    </div>
</main>
<!-- / Status Page -->
