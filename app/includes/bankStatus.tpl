<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>

    <p>Bank contract address: <input type="test" class="form-control">{{ address }}</input></p>
    
    
    <div class="row justify-content-md-center">
    <div class="col-lg-7">
        <h1>Contract Status</h1>
        <table class="table">
            <tr ng-repeat="(name, info) in contractData">
                <td translate="{{ info.translate }}">{{ info.default }}</td>
                <td>{{ info.data.error? info.data.message : info.data.data }}</td>
            </tr>
        </table>
        </div>   
    <div class="col-lg-5">

        <h1>Oracles status</h1>
        <table class="table">
            <thead>
            <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Type</th>
                <th>Update Time</th>
                <th>Rate</th>
            </tr>
            </thead>
            <tr ng-repeat="(address, info) in oracles">
                <td><input class="form-control" type="text" value="{{ address }}"></input></td>
                <td>{{ info.name }}</td>
                <td>{{ info.type }}</td>
                <td>{{ info.updateRate }}</td>
                <td>{{ info.rate }}</td>
            </tr>
        </table>
    </div>
    </div>
    </div>
</main>
<!-- / Bank Status Page -->
