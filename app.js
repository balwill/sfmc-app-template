// Require Server + Layouts
const util              = require('util');
const express           = require('express');
const bodyParser        = require('body-parser');
const expressLayouts    = require('express-ejs-layouts');
const env               = require('dotenv').config()
const app               = express();
const port              = process.env.PORT || 3000

// Set Templating Engine
app.set('view engine', 'ejs');

// Listen on Port
app.listen(port);
console.log(`App is now listening on Port ${port}`)

// Require Marketing Cloud Packages + Parameters
const ET_Client     = require('sfmc-fuelsdk-node');
const FuelRest      = require('fuel-rest');
const FuelSoap      = require('fuel-soap');
const clientId      = process.env.SFMC_CLIENTID                              
const clientSecret  = process.env.SFMC_CLIENTSECRET                          
const stack         = process.env.SFMC_STACK                                 
const origin        = process.env.SFMC_ORIGIN                                
const authOrigin    = process.env.SFMC_AUTHORIGIN                           
const soapOrigin    = process.env.SFMC_SOAPORIGIN   
const parentBU      = Number(process.env.SFMC_PARENT)



// BodyParser + Stack files
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use(expressLayouts);
app.set('layout', './layouts/form-page')

// Navigation
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Home Page',
        fields: [
            {name: 'email', label: 'Email', type: 'email', property: 'required', placeholder: 'Insert Subscriber email', length: '255'}
        ]
    })
})

app.post('/result', (req, res) => {
    res.render('result', {
        title: 'Result Page',
        email: req.body.email

    })

    console.log(req.body)
    
})

// Node Rest Class
const sfmcRest = new FuelRest({
    auth: {
		// options you want passed when Fuel Auth is initialized
        clientId:       clientId,
        clientSecret:   clientSecret,
        authUrl:        authOrigin + 'v2/token',
        authOptions: {
            authVersion: 2,
            accountId: parentBU
        }
    },
    origin: origin 
}) 


// Instantiating Generic Node Class
const sfmcNode = new ET_Client(
    clientId, 
    clientSecret, 
    stack, 
    {
        origin, 
        authOrigin, 
        soapOrigin, 
        authOptions: { 
            authVersion: 2, 
            // accountId: parentBU,                                   
            scope: 'data_extensions_read data_extensions_write',
            applicationType: 'server'
        }   
    }
); 


console.log("RESULTS START HERE:")
// console.log(sfmcNode)

const sfmcSoap = new FuelSoap({
    auth: {
        clientId: clientId
        , clientSecret: clientSecret
        , authUrl: authOrigin + 'v2/token'
        , authOptions: {
            authVersion: 2,
            // accountId: parentBU                             
        }
    }
    , soapEndpoint: soapOrigin
});

// // CODE THAT HELPS YOU SEE WHAT PROPERTIES ARE RETRIEVABLE IN API OBJECT
// sfmcSoap.describe('BusinessUnit', (err, response) => {
//     let properties = response.body.ObjectDefinition.Properties
//     let propertyArray = [];
//     properties.forEach(property => {
//         if (property.IsRetrievable == 'true') {
//             propertyArray.push(property.Name)
//         }
//     })

//     console.log(propertyArray) 
// })


// sfmcSoap.retrieve(
//     'BusinessUnit'
//     , [
//         'ID',
//         'AccountType',
//         'ParentID',
//         'BrandID',
//         'PrivateLabelID',
//         'ReportingParentID',
//         'Name',
//         'Email',
//         'FromName',
//         'BusinessName',
//         'Phone',
//         'Address',
//         'Fax',
//         'City',
//         'State',
//         'Zip',
//         'Country',
//         'IsActive',
//         'IsTestAccount',
//         'Client.ID',
//         'DBID',
//         'CustomerID',
//         'DeletedDate',
//         'EditionID',
//         'IsTrialAccount',
//         'Locale.LocaleCode',
//         'Client.EnterpriseID',
//         'ModifiedDate',
//         'CreatedDate',
//         'Subscription.SubscriptionID',
//         'Subscription.HasPurchasedEmails',
//         'Subscription.EmailsPurchased',
//         'Subscription.Period',
//         'Subscription.AccountsPurchased',
//         'Subscription.LPAccountsPurchased',
//         'Subscription.DOTOAccountsPurchased',
//         'Subscription.BUAccountsPurchased',
//         'Subscription.AdvAccountsPurchased',
//         'Subscription.BeginDate',
//         'Subscription.EndDate',
//         'Subscription.Notes',
//         'Subscription.ContractNumber',
//         'Subscription.ContractModifier',
//         'PartnerKey',
//         'Client.PartnerClientKey',
//         'ParentName',
//         'ParentAccount.ID',
//         'ParentAccount.Name',
//         'ParentAccount.ParentID',
//         'ParentAccount.CustomerKey',
//         'ParentAccount.AccountType',
//         'CustomerKey',
//         'Description',
//         'DefaultSendClassification.ObjectID',
//         'DefaultHomePage.ID',
//         'MasterUnsubscribeBehavior',
//         'InheritAddress',
//         'Roles',
//         'SubscriberFilter',
//         'ContextualRoles',
//         'LanguageLocale.LocaleCode'
//     ]
//     , (err, response) => {
//         if (err) {
//             console.log(err)
//         } else {
//             console.log(response.body.Results)
//     }   
// })


const getAllDataExtensions = async () => {
    var options = {
        props: [
            'ObjectID',
            'PartnerKey',
            'CustomerKey',
            'Name',
            'CreatedDate',
            'ModifiedDate',
            'Client.ID',
            'Description',
            'IsSendable',
            'IsTestable',
            'SendableDataExtensionField.Name',
            'SendableSubscriberField.Name',
            'Template.CustomerKey',
            'CategoryID',
            'Status',
            'IsPlatformObject',
            'DataRetentionPeriodLength',
            'DataRetentionPeriodUnitOfMeasure',
            'RowBasedRetention',
            'ResetRetentionPeriodOnImport',
            'DeleteAtEndOfRetentionPeriod',
            'RetainUntil',
            'DataRetentionPeriod'
        ],
        filter: {
            leftOperand: 'Client.ID'
            , operator: 'isNotNull'
            , rightOperand: ''
        }
    }
    
    let dataExtensionsResult = await new Promise( (resolve, reject) => {
        const de = sfmcNode.dataExtension(options);
        de.get( (err,res) => {
            if(err) {
                console.log(err)
            } else {
                let results = res.body.Results;
                resolve(results)
            } 
            
        }) 
    })

    // console.log(dataExtensionsResult)
    return dataExtensionsResult

}


async function getAllDataExtensionColumns(dataExtensionObject) {
    var options = {
        props: [
            'ObjectID'
            ,'PartnerKey'
            ,'Name'
            ,'DefaultValue'
            ,'MaxLength'
            ,'IsRequired'
            ,'Ordinal'
            ,'IsPrimaryKey'
            ,'FieldType'
            ,'CreatedDate'
            ,'ModifiedDate'
            ,'Scale'
            ,'Client.ID'
            ,'CustomerKey'
        ], 
        filter: {
            leftOperand: 'DataExtension.CustomerKey',
        	operator: 'equals',
        	rightOperand: dataExtensionObject.CustomerKey
        }
    };

    const allDataExtensionColumns = await new Promise( (resolve,reject) => {
        var deColumn = sfmcNode.dataExtensionColumn(options);
        deColumn.get((err, res) => {
            if(err) {
                reject(err)
            } else{
                resolve(res.body.Results)
            }
        })
    })


    return allDataExtensionColumns
    /*
        RESULT EXAMPLE
        [
            {
                Client: { ID: '518000946' },
                PartnerKey: '',
                CreatedDate: '2020-04-07T19:22:56.593',
                ModifiedDate: '2020-04-07T19:22:56.593',
                ObjectID: '3a17fcb1-bdf8-4471-b0a5-edb10a16977b',
                CustomerKey: '[B64D2E50-2105-4611-BBB1-123FE3BC78F5].[TrackingCode]',
                Name: 'TrackingCode',
                DefaultValue: '',
                MaxLength: '256',
                IsRequired: 'false',
                Ordinal: '20',
                IsPrimaryKey: 'false',
                FieldType: 'Text'
            }
        ]
    
    */

}

getAllDataExtensions()
    .then(allDataExtensions => {
        let emailAddressFields = [];
        
        for(i=0; i < allDataExtensions.length; i++) {
            dataExtension = allDataExtensions[i]

            getAllDataExtensionColumns(dataExtension)

            // getAllDataExtensionColumns(dataExtension)
            //     .then( columns => {
            //         let columnNames = []
                    
            //         for (i=0; i < columns.length; i++ ) {
            //             columnNames.push(columns[i])
            //         }

            //         return columnNames
            //     })
            //     .then(columnNames => {
            //         console.log(columnNames)
            //     })
            
            
        }

        return emailAddressFields
    })




// getAllDataExtensionColumns().then()

const getAllDataExtensionRows = async (dataExtensionObject) => {
    let options = {
        Name: dataExtensionObject.CustomerKey
        , props: ['EmailAddress', 'createdDate']

    };

    let allDataExtensionRows = await new Promise ( (resolve,reject) => {
        var deRow = sfmcNode.dataExtensionRow(options);
    
    })   


    // allDataExtensionRows.forEach(row => {
    //     // returns [{Name: , Value: }]
    //     console.log(row.Properties.Property)
    // })
    
}

// getAllDataExtensionRows('B64D2E50-2105-4611-BBB1-123FE3BC78F5').then(console.log)

