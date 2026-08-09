import json
from datetime import datetime

from hash import hash_fnv1a_32
from plexapi.server import PlexServer

baseurl = input(
    "Enter the URL of your plex server (formatted as https://example.com): "
)
token = input("Enter your Plex token: ")
plex = PlexServer(baseurl, token)

# Access your Music library
music = plex.library.section(
    input("Please enter the name of the library (eg: Tim's Music): ")
)

# Fetch tracks that have a user rating
rated_tracks = [track for track in music.searchTracks() if track.userRating is not None]

tz = datetime.now().astimezone().tzinfo
now = datetime.now(tz).isoformat()

scores_file = {"version": 1, "scores": {}}
for track in rated_tracks:
    hashString = (
        f"{track.title}|{track.grandparentTitle}"  # grandparentTitle is the artist name
    )

    trackId = str(hash_fnv1a_32(hashString))

    plexRating = track.userRating
    rating_negative_1_to_1 = (track.userRating / 5.0) - 1
    rating = (
        round(rating_negative_1_to_1 * 40) - 10
    )  # -50 to +30 (so it's not too polarised)

    scores_file["scores"][trackId] = {"score": rating, "date": now}

with open("./plexamp-scores.json", "w") as file:
    file.write(json.dumps(scores_file, indent=4))
