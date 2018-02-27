<!-- Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.status.id" ng-controller='statusCtrl' ng-cloak>
    <div class="row justify-content-md-center">
        <section ng-show="loading">
            Loading...
        </section>
        <section ng-hide="loading">
            <div class="col-lg-10 col-lg-offset-1">

            </div>
            <div class="col-lg-10 col-lg-offset-1">
                    <button class="btn {{ showOracles ? '' : 'btn-success' }}" ng-click="showOracles=!showOracles"><a translate="LIBRESTATUS_contractStatus">Contract status</a></li>
                    <button class="btn {{ showOracles ? 'btn-success' : '' }}" ng-click="showOracles=!showOracles"><a translate="LIBRESTATUS_oraclesStatus">Oracles</a></li>
            </div>
            <div class="col-lg-10 col-lg-offset-1" ng-hide="showOracles">
                <h1 translate="LIBRESTATUS_contractStatus">Contract Status</h1>
                <table class="table">
                    <tr>
                        <td translate="LIBRESTATUS_bankContractAddress">Bank contract address</td>
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
                <h1 translate="LIBRESTATUS_oraclesStatus">Oracles status</h1>
                <table class="table">
                    <thead>
                    <tr>
                        <th translate="LIBRESTATUS_address">Address</th>
                        <th translate="LIBRESTATUS_name">Name</th>
                        <!--th translate="LIBRESTATUS_type">Type</th-->
                        <th translate="LIBRESTATUS_updateTime">Update Time</th>
                        <th translate="LIBRESTATUS_rate">Rate</th>
                    </tr>
                    </thead>
                    
                    <tr ng-repeat="oracle in oracles">
                        <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank"
                        rel="noopener noreferrer">{{ oracle.address | limitTo: 15 }}&hellip;</a></td>
                        <td>{{ oracle.name }}</td>
                        <!--td>{{ oracle.type }}</td-->
                        <td>{{ oracle.updateTime }}</td>
                        <td>{{ oracle.outdated ? 'outdated' : (oracle.waiting ? ('LIBRE_waiting' | translate) : oracle.rate + ' Libre/ETH' ) }}</td>
                    </tr>
                </table>
            </div>
        </section>
    </div>
</main>
<!-- / Status Page -->
