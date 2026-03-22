import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv
from fastapi import Request

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in backend environment variables")

def get_supabase_client(request: Request) -> Client:
    """
    Creates a new Supabase client per request.
    If the frontend passes an Authorization token, we inject it into the client
    so it runs under the user's context, bypassing anonymous RLS restrictions.
    """
    auth_header = request.headers.get("Authorization")
    
    if auth_header:
        options = ClientOptions(headers={"Authorization": auth_header})
        return create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
        
    return create_client(SUPABASE_URL, SUPABASE_KEY)
