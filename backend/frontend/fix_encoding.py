import codecs
import re

# Ler o arquivo com encoding correto
with open('src/apps/main-app/pages/home.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Corrigir problemas de encoding específicos
replacements = {
    'GestA渙 de HotAcis': 'Gestão de Hotéis',
    'HotAcis': 'Hotéis',
    'MoA\u0015ambique': 'Moçambique',
    'DisponA-veis': 'Disponíveis',
    'EspaA\u0015os': 'Espaços',
    'LocalizaA\u0015A渙': 'Localização',
    'ExperiAcia': 'Experiência',
    'AnfitriA鎒s': 'Anfitriões',
    'veA-culo': 'veículo',
    'Partida A�s': 'Partida às',
    'SaA-da': 'Saída',
    'dY?': '🏨',
    'dY?-�,?': '🏖️',
    'dY�?': '🦁',
    'dYZ�': '🎵',
    'dYZ"': '🎨',
    'dYZ': '🎤',
    'dY"<': '📋',
    'dY>瓔,?': '🛡️',
    'dY\'�': '💰',
    'dY"�': '📱',
    'dY\'�': '💡',
    'dYs?': '🚀',
    '僶.': '✅',
    '僺��,?': '⚠️'
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Escrever o arquivo corrigido
with open('src/apps/main-app/pages/home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Arquivo corrigido com sucesso!")