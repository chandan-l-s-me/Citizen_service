import requests
import json

API_KEY = "AIzaSyBNJUW5PED5fTiDjAkf_Hl1mhUYePii_T4"   # ← Put your key here

def test_directions():
    url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": "Koramangala, Bangalore",
        "destination": "Whitefield, Bangalore",
        "mode": "driving",
        "key": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    # Print raw response
    print(json.dumps(data, indent=4))

    # Check status
    if data.get("status") == "OK":
        print("\n✅ Directions API is working!")
        route = data["routes"][0]["legs"][0]
        print("Distance:", route["distance"]["text"])
        print("Duration:", route["duration"]["text"])
    else:
        print("\n❌ API Error:", data.get("status"))
        print("Message:", data.get("error_message"))

if __name__ == "__main__":
    test_directions()
