<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>
    <div class="row justify-content-md-center">
        <section ng-show="loading">
            Loading...
        </section>
        <section ng-hide="loading">
            <nav class="container nav-container">
                <div class="nav-scroll">
                <ul class="nav-inner">
                    <li class="nav-item {{ showOracles ? '' : 'active' }}" ng-click="showOracles=!showOracles"><a translate="BANKSTATUS_contractStatus">Contract status</a></li>
                    <li class="nav-item {{ showOracles ? 'active' : '' }}" ng-click="showOracles=!showOracles"><a translate="BANKSTATUS_oraclesStatus">Oracles</a></li>
                </ul>
                </div>
            </nav>
            <div class="col-lg-10 col-lg-offset-1">

            </div>
            <div class="col-lg-10 col-lg-offset-1" ng-hide="showOracles">
                <h1 translate="BANKSTATUS_contractStatus">Contract Status</h1>
                <table class="table">
                    <tr>
                        <td translate="BANKSTATUS_bankContractAddress">Bank contract address</td>
                        <td>
                            <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank" rel="noopener noreferrer">
                                {{ address }}
                            </a>
                        </td>
                    </tr>
                <tr ng-repeat="item in contractData">
                        <td translate="{{ item.translate }}">{{ item.varName }}</td>
                        <td ng-hide="(item.data.indexOf('0x') == 0) && (item.data.length == 42)">{{ item.error ? item.message : item.data }}</td>
                        <td ng-show="(item.data.indexOf('0x') == 0) && (item.data.length == 42)">
                            <a ng-href="{{ item.error ? '#' : ajaxReq.blockExplorerAddr.replace('[[address]]', item.data) }}" target="_blank"
                                rel="noopener noreferrer">{{ item.error ? item.message : item.data }}&hellip;</a>
                        </td>
                    </tr>
                </table>
            </div>   
            <div class="col-lg-10 col-lg-offset-1" ng-show="showOracles">
                <h1 translate="BANKSTATUS_oraclesStatus">Oracles status</h1>
                <table class="table">
                    <thead>
                    <tr>
                        <th translate="BANKSTATUS_address">Address</th>
                        <th translate="BANKSTATUS_name">Name</th>
                        <!--th translate="BANKSTATUS_type">Type</th-->
                        <th translate="BANKSTATUS_updateTime">Update Time</th>
                        <th translate="BANKSTATUS_rate">Rate</th>
                    </tr>
                    </thead>
                    
                    <tr ng-repeat="oracle in oracles">
                        <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank"
                        rel="noopener noreferrer">{{ oracle.address | limitTo: 15 }}&hellip;</a></td>
                        <td>{{ oracle.name }}</td>
                        <!--td>{{ oracle.type }}</td-->
                        <td>{{ oracle.updateTime }}</td>
                        <td>{{ oracle.waiting ? ('LIBRE_waiting' | translate) : oracle.rate }}</td>
                    </tr>
                </table>
            </div>
        </section>
    </div>
</main>
<!-- / Bank Status Page -->
