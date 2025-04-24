import boto3
from botocore.exceptions import NoCredentialsError
from tqdm import tqdm
import os
import sys
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('s3_upload')

class ProgressPercentage:
    def __init__(self, filename):
        self._filename = filename
        self._size = float(os.path.getsize(filename))
        self._seen_so_far = 0
        logger.info(f"File size: {self._size/1024/1024:.2f} MB")
        self._tqdm = tqdm(total=self._size, unit='B', unit_scale=True, desc=os.path.basename(filename))

    def __call__(self, bytes_amount):
        self._seen_so_far += bytes_amount
        percentage = (self._seen_so_far / self._size) * 100
        logger.info(f"Upload progress: {percentage:.2f}% ({self._seen_so_far}/{self._size} bytes)")
        self._tqdm.update(bytes_amount)

def upload_zip_to_s3(file_path, bucket_name, region_name='us-east-1'):
    """
    Uploads a zip file to an S3 bucket root with progress bar, using the same filename.

    Args:
        file_path (str): Local path to the zip file.
        bucket_name (str): S3 bucket name.
        region_name (str): AWS region of the bucket.
        
    Returns:
        dict: A dictionary with status and URL information.
    """
    logger.info(f"Starting upload of {file_path} to bucket {bucket_name} in region {region_name}")
    
    try:
        file_name = os.path.basename(file_path)  # Extract just the filename
        logger.info(f"File name: {file_name}")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return {"status": "error", "message": "The file was not found."}
            
        logger.info("Creating S3 client...")
        s3 = boto3.client('s3', region_name=region_name)
        
        logger.info(f"Starting S3 upload_file operation...")
        s3.upload_file(
            Filename=file_path,
            Bucket=bucket_name,
            Key=file_name,
            Callback=ProgressPercentage(file_path)
        )
        
        success_message = f"Upload successful: s3://{bucket_name}/{file_name}"
        logger.info(success_message)
        print(f"\n✅ {success_message}")
        return {"status": "success", "url": f"s3://{bucket_name}/{file_name}"}
    except FileNotFoundError:
        error_message = f"The file was not found: {file_path}"
        logger.error(error_message)
        print(f"❌ {error_message}")
        return {"status": "error", "message": error_message}
    except NoCredentialsError:
        error_message = "AWS credentials not found."
        logger.error(error_message)
        print(f"❌ {error_message}")
        return {"status": "error", "message": error_message}
    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        logger.error(error_message, exc_info=True)
        print(f"❌ {error_message}")
        return {"status": "error", "message": error_message}

# When called directly from the command line
if __name__ == "__main__":
    logger.info(f"Script started with arguments: {sys.argv}")
    
    if len(sys.argv) < 3:
        usage_message = "Usage: python s3_upload.py <file_path> <bucket_name> [<region_name>]"
        logger.error("Insufficient arguments provided")
        print(usage_message)
        sys.exit(1)
    
    file_path = sys.argv[1]
    bucket_name = sys.argv[2]
    region_name = sys.argv[3] if len(sys.argv) > 3 else 'us-east-1'
    
    logger.info(f"Parameters: file_path={file_path}, bucket_name={bucket_name}, region_name={region_name}")
    
    result = upload_zip_to_s3(file_path, bucket_name, region_name)
    json_result = json.dumps(result)
    logger.info(f"Final result: {json_result}")
    # Important: This is the final output that the Node.js API will parse
    print(json_result) 