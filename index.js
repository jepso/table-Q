

var Q     = require('qq'),
    azure = require('azure');

/**
 * Create table service, takes the same arguments as the native azure library
 * 
 * @return {object} Table Service
 */
var TableQ = module.exports = function(){
    var service = azure.createTableService.apply(azure, arguments);
    var tableService = {};

    /**
     * Create table if not exists
     * 
     * @param {string} name The name of the table to create
     * @return {>bool} success
     */
    tableService.createTable = node(service.createTableIfNotExists, service);

    /**
     * Get a list of all table names
     * 
     * @return {>array} array of ALL table names
     */
    tableService.getTables = function(){
        var result = Q.defer();
        var res = [];

        service.queryTables(next)
        function next(err, tables, continuation){
            if(err) return result.reject(err);
            for(var i = 0; i<tables.length; i++){
                res.push(tables[i]);
            }
            if(continuation.hasNextPage()){
                continuation.getNextPage(next);
            }else{
                result.resolve(res.map(function(tab){
                    return tab.TableName;
                }));
            }
        };

        return result.promise;
    };

    /**
     * Delete a table
     * 
     * @param {string} name The name of the table to delete
     * @return {>bool} success
     */
    tableService.deleteTable = node(service.deleteTable, service);

    /**
     * Get the service to access and individual table
     * @param  {string} tableName The table you want to access
     * @return {object}           Table service for that table
     */
    tableService.getTable = function(tableName){
        var table = {name:tableName};


        table.queryEntity = function (partitionKey, rowKey){
            return ncall(service.queryEntity, service, tableName, 
                partitionKey, rowKey);
        };

        table.deleteEntity = function (partitionKey, rowKey, Etag){
            return ncall(service.deleteEntity, service, 
                tableName, {PartitionKey:partitionKey,RowKey:rowKey,Etag:Etag},
                {checkEtag:(typeof Etag != "undefined")});
        }

        table.select = function(){
            var query = azure.TableQuery.select.apply(TableQuery, arguments)
                .from(tableName);
            query.execute = function(){

            };
        }

        return table;
    };

    return tableService;
};

function ncall(method, tableService){
    return node(method, tableService)
        .apply(tableService, Array.prototype.slice.call(arguments, 2));
}
function node(method, tableService){
    return function(){
        var args = Array.prototype.slice.call(arguments, 0);
        return Q.all(args).then(function(args){
            return Q.node(method).apply(tableService, args); 
        });
    }
}

function ObjectStream(){
    var ended = Q.defer();
    var listEnd = Q.resolve();
    var handlers = [];
    this.next = function(value){
        var nextValue = listEnd.then(function(){
            return value;
        }).then(function(){
            handlers.map(function(handler){
                return handler()
            });
        }, function(reason){
            end();
            return Q.reject(reason);
        })
        listEnd = nextValue;
    };
    var end = this.end = function(){
        listEnd.then(function(){
            ended.resolve();
        }, function(reason){
            ended.reject(reason);
        });
    };
    this.onNext = function(handler){

    };
    //return promise
    this.ended = function(){
        return ended.promise;
    };
}