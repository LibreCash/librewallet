<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>
    <div class="row justify-content-md-center">
        <nav class="container nav-container">
            <div class="nav-scroll">
            <ul class="nav-inner">
                <li class="nav-item {{ showOracles ? '' : 'active' }}" ng-click="showOracles=!showOracles"><a href="#" translate="BANKSTATUS_contractStatus">Contract status</a></li>
                <li class="nav-item {{ showOracles ? 'active' : '' }}" ng-click="showOracles=!showOracles"><a href="#" translate="BANKSTATUS_oraclesStatus">Oracles</a></li>
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
                <tr ng-repeat="(name, info) in contractData">
                    <td translate="{{ info.translate }}">{{ info.default }}</td>
                    <td ng-hide="(info.data.data.indexOf('0x') == 0) && (info.data.data.length == 42)">{{ info.data.error ? info.data.message : info.data.data }}</td>
                    <td ng-show="(info.data.data.indexOf('0x') == 0) && (info.data.data.length == 42)">
                        <a ng-href="{{ info.data.error ? '#' : ajaxReq.blockExplorerAddr.replace('[[address]]', info.data.data) }}" target="_blank"
                            rel="noopener noreferrer">{{ info.data.error ? info.data.message : info.data.data }}&hellip;</a>
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
                    <th translate="BANKSTATUS_type">Type</th>
                    <th translate="BANKSTATUS_updateTime">Update Time</th>
                    <th translate="BANKSTATUS_rate">Rate</th>
                </tr>
                </thead>
                
                <tr ng-repeat="(address, info) in oracles">
                    <td><a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', address) }}" target="_blank"
                     rel="noopener noreferrer">{{ address | limitTo: 15 }}&hellip;</a></td>
                    <td>{{ info.name }}</td>
                    <td>{{ info.type }}</td>
                    <td>{{ info.updateTime }}</td>
                    <td>{{ info.rate }}</td>
                </tr>
            </table>
        </div>
    </div>
</main>
<!-- / Bank Status Page -->
