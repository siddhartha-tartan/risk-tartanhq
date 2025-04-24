import boto3
from botocore.exceptions import NoCredentialsError
from tqdm import tqdm
import os
import json

class ProgressPercentage:
    def __init__(self, filename):
        self._filename = filename
        self._size = float(os.path.getsize(filename))
        self._seen_so_far = 0
        self._tqdm = tqdm(total=self._size, unit='B', unit_scale=True, desc=os.path.basename(filename))

    def __call__(self, bytes_amount):
        self._seen_so_far += bytes_amount
        self._tqdm.update(bytes_amount)

def upload_zip_to_s3(file_path, bucket_name, region_name='us-east-1'):
    """
    Uploads a zip file to an S3 bucket root with progress bar, using the same filename.

    Args:
        file_path (str): Local path to the zip file.
        bucket_name (str): S3 bucket name.
        region_name (str): AWS region of the bucket.
    
    Returns:
        dict: Result with status, s3_url or error.
    """
    try:
        file_name = os.path.basename(file_path)
        s3 = boto3.client('s3', region_name=region_name)
        s3.upload_file(
            Filename=file_path,
            Bucket=bucket_name,
            Key=file_name,
            Callback=ProgressPercentage(file_path)
        )
        return {
            "file": file_name,
            "status": "success",
            "s3_url": f"s3://{bucket_name}/{file_name}"
        }
    except FileNotFoundError:
        return {"file": file_path, "status": "error", "error": "File not found"}
    except NoCredentialsError:
        return {"file": file_path, "status": "error", "error": "AWS credentials not found"}
    except Exception as e:
        return {"file": file_path, "status": "error", "error": str(e)}

def upload_all_zips_in_folder(folder_path, bucket_name, region_name='us-east-1'):
    """
    Uploads all .zip files in a folder and saves the responses to a JSON file.

    Args:
        folder_path (str): Path to the folder containing zip files.
        bucket_name (str): S3 bucket name.
        region_name (str): AWS region of the bucket.
    """
    responses = []
    if not os.path.exists(folder_path):
        print(f"❌ Folder not found: {folder_path}")
        return

    zip_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.zip')]

    if not zip_files:
        print("❌ No zip files found in the folder.")
        return

    for zip_file in zip_files:
        full_path = os.path.join(folder_path, zip_file)
        print(f"🔼 Uploading: {zip_file}")
        response = upload_zip_to_s3(full_path, bucket_name, region_name)
        responses.append(response)

    # Save all responses to a JSON file
    output_path = os.path.join(folder_path, 's3_upload_responses.json')
    with open(output_path, 'w') as f:
        json.dump(responses, f, indent=4)

    print(f"\n📦 All upload responses saved to: {output_path}")

# --- Execution ---
if __name__ == '__main__':
    folder_to_upload = '/Users/siddhartha/Downloads/PL SET of documents for POC/Script/zips'
    bucket = 'ai-policy-benchmark'
    aws_region = 'us-east-1'

    upload_all_zips_in_folder(folder_to_upload, bucket, aws_region)
