$path = "C:\Users\User\Downloads\LinkA\linka-fullstack-mainzip\linka-fullstack-main"
Get-ChildItem -Path $path -Filter *.sql -Recurse | Select-Object -First 20 Name, FullName