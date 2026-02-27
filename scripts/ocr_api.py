import requests
import json
import sys
import traceback
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API configuration from environment variables
OCR_API_URL = os.environ.get('OCR_API_URL', 'http://rulesyncapi-cl1.ap-south-1.elasticbeanstalk.com/api/v1/cam_ocr')

# Hardcoded OCR API authentication credentials
OCR_API_USERNAME = 'chat@service.user'
OCR_API_PASSWORD = 'chat@123'
OCR_API_KEY = '9ac4a1af6ba1ad743133ae7d328969412717e4ee67132ad0e8b2212bf2e169e2'
OCR_ORGANIZATION_ID = 'e47904cc-c5e6-4811-a7e8-34568ec87267'

def log_message(message, level="INFO"):
    """Helper to create consistent log messages with timestamps"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] [{level}] OCR_API: {message}")

def process_ocr(request_id, bucket_name, s3_key):
    log_message(f"Starting OCR processing with request_id={request_id}, bucket={bucket_name}, s3_key={s3_key}")
    
    payload = json.dumps({
        "request_id": request_id,
        "request_type": "cam_ocr",
        "bucket_name": bucket_name,
        "s3_key": s3_key,
        "pre_signed_download_url": None
    })
    headers = {
        'Username': OCR_API_USERNAME,
        'Password': OCR_API_PASSWORD,
        'x-api-key': OCR_API_KEY,
        'organization-id': OCR_ORGANIZATION_ID,
        'Content-Type': 'application/json'
    }

    try:
        log_message(f"Sending request to OCR API: {OCR_API_URL}")
        log_message(f"Request payload: {payload}")
        
        response = requests.request("POST", OCR_API_URL, headers=headers, data=payload)
        
        log_message(f"OCR API response status code: {response.status_code}")
        
        if response.status_code != 200:
            error_message = f"OCR API returned non-200 status code: {response.status_code}"
            log_message(error_message, "ERROR")
            
            # Log detailed error content
            log_message(f"Response content preview: {response.text[:500]}...", "ERROR")
            
            # Return error information in structured format
            error_response = {
                "error": True,
                "status_code": str(response.status_code),
                "message": error_message,
                "details": response.text[:1000] if response.text else "No response content"
            }
            return json.dumps(error_response)
        
        # Get the raw text response from the API
        response_text = response.text
        log_message(f"Response text length: {len(response_text)}")
        log_message(f"Response text preview: {response_text[:100]}...")
        
        # Try to parse JSON response to validate
        try:
            response_json = json.loads(response_text)
            
            # Check if response is an error message even with 200 status
            if 'status_code' in response_json and response_json['status_code'] != '200':
                error_message = f"API returned error status: {response_json['status_code']}"
                log_message(error_message, "ERROR")
                log_message(f"Error message: {response_json.get('message', 'Unknown error')}", "ERROR")
                
                error_response = {
                    "error": True,
                    "status_code": response_json['status_code'],
                    "message": response_json.get('message', 'Unknown error'),
                    "details": {
                        "request_id": request_id,
                        "status_code": response_json['status_code'],
                        "message": response_json.get('message', 'Unknown error'),
                        "request_type": "CAM_OCR",
                        "response": None,
                        "health_check": False
                    }
                }
                return json.dumps(error_response)
            
            # Check if it looks like valid OCR data (has at least one key with text)
            if len(response_json) == 0:
                error_message = "OCR API returned empty JSON object"
                log_message(error_message, "ERROR")
                
                error_response = {
                    "error": True,
                    "status_code": "DATA_ERROR",
                    "message": error_message,
                    "details": {
                        "request_id": request_id,
                        "status_code": "DATA_ERROR",
                        "message": error_message,
                        "request_type": "CAM_OCR",
                        "response": None,
                        "health_check": False
                    }
                }
                return json.dumps(error_response)
            
            # Success - valid OCR data
            log_message(f"Successfully extracted OCR data for {len(response_json)} files")
            for filename, text in response_json.items():
                # Handle None values for text
                if text is None:
                    text_preview = "[No OCR text available]"
                else:
                    text_preview = text[:50] + "..." if len(text) > 50 else text
                log_message(f"OCR for '{filename}': {text_preview}")
                
            # Return the raw response text
            return response_text
            
        except json.JSONDecodeError as e:
            error_message = "Response is not valid JSON"
            log_message(error_message, "ERROR")
            log_message(f"JSON error: {str(e)}", "ERROR")
            
            error_response = {
                "error": True,
                "status_code": "INVALID_JSON",
                "message": error_message,
                "details": {
                    "request_id": request_id,
                    "status_code": "INVALID_JSON",
                    "message": error_message,
                    "request_type": "CAM_OCR",
                    "response": None,
                    "health_check": False
                }
            }
            return json.dumps(error_response)
            
    except requests.exceptions.RequestException as e:
        error_message = f"Error during OCR API request: {str(e)}"
        log_message(error_message, "ERROR")
        
        # Get traceback as string instead of using the traceback object
        tb_string = traceback.format_exc()
        log_message(f"Traceback: {tb_string}", "ERROR")
        
        error_response = {
            "error": True,
            "status_code": "REQUEST_ERROR",
            "message": error_message,
            "details": {
                "request_id": request_id,
                "status_code": "REQUEST_ERROR",
                "message": error_message,
                "request_type": "CAM_OCR",
                "response": None,
                "health_check": False,
                "traceback": tb_string
            }
        }
        return json.dumps(error_response)

# When called directly from the command line
if __name__ == "__main__":
    if len(sys.argv) < 4:
        log_message("Usage: python ocr_api.py <request_id> <bucket_name> <s3_key>", "ERROR")
        sys.exit(1)
    
    try:
        request_id = sys.argv[1]
        bucket_name = sys.argv[2]
        s3_key = sys.argv[3]
        
        log_message(f"OCR script started with arguments: {sys.argv[1:]}")
        
        # Process OCR and get result
        result = process_ocr(request_id, bucket_name, s3_key)
        
        # Print the response directly without any additional processing
        print(result)
    except Exception as e:
        error_message = f"Unhandled exception in OCR script: {str(e)}"
        log_message(error_message, "ERROR")
        
        # Get traceback as string instead of the traceback object
        tb_string = traceback.format_exc()
        log_message(f"Traceback: {tb_string}", "ERROR")
        
        error_response = {
            "error": True,
            "status_code": "SCRIPT_ERROR",
            "message": error_message,
            "details": {
                "request_id": sys.argv[1] if len(sys.argv) > 1 else "unknown",
                "status_code": "SCRIPT_ERROR",
                "message": error_message,
                "request_type": "CAM_OCR",
                "response": None,
                "health_check": False,
                "traceback": tb_string
            }
        }
        print(json.dumps(error_response)) 