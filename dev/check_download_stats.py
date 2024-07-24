import requests

url = "https://api.github.com/repos/kraemer-lab/GRAPEVNE/releases"
response = requests.get(url)
data = response.json()

for release in data:
    print(release['tag_name'])
    total_downloads = 0
    for asset in release['assets']:
        print(asset['name'], asset['download_count'])
        total_downloads += asset['download_count']
    print("Total downloads:", total_downloads)
    print()
