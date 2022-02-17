const XLSX = require('xlsx');
const fs = require('fs');

async function readFileCSV(s3, bucket_name, parent_folder, file_name){
    const params = {Bucket: bucket_name, Key: parent_folder + file_name}
    const response = await s3.getObject(params).promise() // await the promise
    const fileContent = response.Body.toString();
    return fileContent
}

const uploadFileHTML = (s3, bucket_name, parent_folder, file_name, file_html) => {
 
    // Setting up S3 upload parameters
    const params = {
        Bucket: bucket_name,
        Key: parent_folder + file_name,
        Body: file_html,
        ContentType: 'text/html'
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

const uploadFileCSV = (s3, bucket_name, parent_folder, file_name, list_of_lists) => {
    
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(list_of_lists);
    XLSX.utils.book_append_sheet(book, sheet, 'sheet');

    const fileContent = XLSX.write(book, {
        bookType: 'csv',
        type: 'buffer',
    });

    // Setting up S3 upload parameters
    const params = {
        Bucket: bucket_name,
        Key: parent_folder + file_name,
        Body: fileContent,
        ContentType: 'text/csv'
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};


async function directoryExists(s3, bucket_name, parent_folder_name, folder_name) {

    var params = {
        Bucket: bucket_name,
        Prefix: parent_folder_name
    };

    let directories = await s3.listObjectsV2(params,
        function (err, data) { err ? console.log(err, err.stack) : null })
        .promise()
    
    console.log(directories.Contents.filter(e => e.Key.includes(folder_name)));

    return directories.Contents.filter(e => e.Key.includes(folder_name)).length > 0
}

async function htmlKey(s3, bucket_name, folder_name, file_name){

    var params = {
        Bucket: bucket_name,
        Prefix: folder_name+file_name
    };

    let files = await s3.listObjectsV2(params,
        function (err, data) { err ? console.log(err, err.stack) : null })
        .promise()

    return files.Contents.filter(e => e.Key.includes(folder_name))
}

async function readFileHTML(s3, bucket_name, html_key){

    const params = {
        Bucket: bucket_name, 
        Key: html_key
    }
    
    const response = await s3.getObject(params).promise() // await the promise
    const fileContent = response.Body.toString();
    return fileContent
}


const createFolder = (s3, bucket_name, parent_folder_name, folder_name) => {

    let params = {
        Bucket: bucket_name,
        Key: parent_folder_name + folder_name,
        ACL: 'public-read',
        Body: ''
    };

    s3.upload(params, function (err, data) {
        if (err) {
            console.log("Error creating the folder: ", err);
        } else {
            console.log("Successfully created a folder on S3");

        }
    });
}

function prepareDirectory(s3, bucket_name, parent_folder_name, folder_name) {

    let directory_exists = directoryExists(s3,bucket_name, parent_folder_name, folder_name)

    if (!directory_exists) {
        createFolder(s3,bucket_name, parent_folder_name, folder_name)
    }
}


module.exports = { readFileHTML, htmlKey, readFileCSV, uploadFileCSV, uploadFileHTML, prepareDirectory };
