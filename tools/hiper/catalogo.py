# -*- coding: utf-8 -*-
"""Catálogo do app de hipertrofia (Julio Neves - Treinos v2).

name  : nome canônico pt-BR (chave das cargas no app)
en    : termo de busca no YouTube
equip : equipamento exibido no treino
inc   : degrau de carga em kg (barra 2.5 total, halter 2 por mão, máquina 5, polia 2.5, 0 = peso corporal)
main  : exercício principal (bloco A): progressão por % (2,5%) em vez de degrau fixo
grupo : grupamento (para volume semanal)
"""

C = [
  # --- Pernas: quadríceps
  dict(name="Agachamento Livre",        en="barbell back squat",          equip="Barra + rack",          inc=2.5, main=True,  grupo="Quadríceps"),
  dict(name="Agachamento Hack",         en="hack squat machine",          equip="Máquina hack",          inc=5,   main=True,  grupo="Quadríceps"),
  dict(name="Leg Press 45",             en="leg press 45 degree",         equip="Leg press 45°",         inc=5,   main=False, grupo="Quadríceps"),
  dict(name="Agachamento Búlgaro",      en="dumbbell bulgarian split squat", equip="Halteres + banco",   inc=2,   main=False, grupo="Quadríceps"),
  dict(name="Cadeira Extensora",        en="leg extension machine",       equip="Cadeira extensora",     inc=5,   main=False, grupo="Quadríceps"),
  dict(name="Goblet Squat",             en="goblet squat",                equip="Halter ou kettlebell",  inc=2,   main=False, grupo="Quadríceps"),
  dict(name="Afundo Halteres",          en="dumbbell walking lunge",      equip="Halteres",              inc=2,   main=False, grupo="Quadríceps"),
  dict(name="Step Up Halteres",         en="dumbbell step up",            equip="Halteres + caixa",      inc=2,   main=False, grupo="Quadríceps"),
  # --- Pernas: posterior e glúteo
  dict(name="Levantamento Terra",       en="barbell deadlift",            equip="Barra + anilhas",       inc=2.5, main=True,  grupo="Posterior"),
  dict(name="Stiff Barra",              en="barbell romanian deadlift",   equip="Barra",                 inc=2.5, main=True,  grupo="Posterior"),
  dict(name="Stiff Halteres",           en="dumbbell romanian deadlift",  equip="Halteres",              inc=2,   main=False, grupo="Posterior"),
  dict(name="Hip Thrust",               en="barbell hip thrust",          equip="Barra + banco",         inc=2.5, main=False, grupo="Glúteo"),
  dict(name="Mesa Flexora",             en="lying leg curl machine",      equip="Mesa flexora",          inc=5,   main=False, grupo="Posterior"),
  dict(name="Cadeira Flexora",          en="seated leg curl machine",     equip="Cadeira flexora",       inc=5,   main=False, grupo="Posterior"),
  dict(name="Cadeira Abdutora",         en="hip abduction machine",       equip="Cadeira abdutora",      inc=5,   main=False, grupo="Glúteo"),
  dict(name="Kettlebell Swing",         en="kettlebell swing",            equip="Kettlebell",            inc=4,   main=False, grupo="Posterior"),
  dict(name="Extensão Lombar",          en="back extension 45 degree",    equip="Banco romano 45°",      inc=0,   main=False, grupo="Lombar"),
  dict(name="Panturrilha em Pé",        en="standing calf raise machine", equip="Máquina de panturrilha",inc=5,   main=False, grupo="Panturrilha"),
  dict(name="Panturrilha Sentado",      en="seated calf raise",           equip="Panturrilha sentado",   inc=5,   main=False, grupo="Panturrilha"),
  # --- Peito
  dict(name="Supino Reto Barra",        en="barbell bench press",         equip="Barra + banco reto",    inc=2.5, main=True,  grupo="Peito"),
  dict(name="Supino Inclinado Barra",   en="incline barbell bench press", equip="Barra + banco inclinado", inc=2.5, main=True, grupo="Peito"),
  dict(name="Supino Inclinado Halteres",en="incline dumbbell press",      equip="Halteres + banco inclinado", inc=2, main=False, grupo="Peito"),
  dict(name="Supino Halteres",          en="dumbbell bench press",        equip="Halteres + banco reto", inc=2,   main=False, grupo="Peito"),
  dict(name="Crossover Polia",          en="cable crossover",             equip="Polia dupla",           inc=2.5, main=False, grupo="Peito"),
  dict(name="Crucifixo Máquina",        en="pec deck machine fly",        equip="Peck deck",             inc=5,   main=False, grupo="Peito"),
  dict(name="Paralelas",                en="chest dips",                  equip="Paralelas",             inc=0,   main=False, grupo="Peito"),
  dict(name="Flexão",                   en="push up",                     equip="Peso corporal",         inc=0,   main=False, grupo="Peito"),
  # --- Ombro
  dict(name="Desenvolvimento Halteres", en="seated dumbbell shoulder press", equip="Halteres + banco",    inc=2,   main=False, grupo="Ombro"),
  dict(name="Desenvolvimento Máquina",  en="machine shoulder press",      equip="Máquina de desenvolvimento", inc=5, main=False, grupo="Ombro"),
  dict(name="Elevação Lateral",         en="dumbbell lateral raise",      equip="Halteres",              inc=1,   main=False, grupo="Ombro"),
  dict(name="Elevação Lateral Polia",   en="cable lateral raise",         equip="Polia baixa",           inc=2.5, main=False, grupo="Ombro"),
  dict(name="Face Pull",                en="face pull",                   equip="Polia + corda",         inc=2.5, main=False, grupo="Ombro posterior"),
  dict(name="Crucifixo Inverso",        en="reverse dumbbell fly",        equip="Halteres",              inc=1,   main=False, grupo="Ombro posterior"),
  # --- Costas
  dict(name="Remada Curvada",           en="barbell bent over row",       equip="Barra",                 inc=2.5, main=True,  grupo="Costas"),
  dict(name="Remada Cavalinho",         en="t-bar row",                   equip="Barra T / landmine",    inc=2.5, main=True,  grupo="Costas"),
  dict(name="Barra Fixa",               en="pull up",                     equip="Barra fixa (ou graviton)", inc=0, main=False, grupo="Costas"),
  dict(name="Pulldown Polia",           en="lat pulldown",                equip="Polia alta (pulldown)", inc=5,   main=False, grupo="Costas"),
  dict(name="Remada Baixa",             en="seated cable row",            equip="Polia baixa (remada)",  inc=5,   main=False, grupo="Costas"),
  dict(name="Remada Unilateral",        en="single arm dumbbell row",     equip="Halter + banco",        inc=2,   main=False, grupo="Costas"),
  dict(name="Pullover Polia",           en="straight arm cable pulldown", equip="Polia alta + barra",    inc=2.5, main=False, grupo="Costas"),
  # --- Braços
  dict(name="Rosca Direta",             en="barbell curl",                equip="Barra (reta ou W)",     inc=2,   main=False, grupo="Bíceps"),
  dict(name="Rosca Alternada",          en="alternating dumbbell curl",   equip="Halteres",              inc=1,   main=False, grupo="Bíceps"),
  dict(name="Rosca Martelo",            en="dumbbell hammer curl",        equip="Halteres",              inc=1,   main=False, grupo="Bíceps"),
  dict(name="Rosca Polia",              en="cable bicep curl",            equip="Polia baixa",           inc=2.5, main=False, grupo="Bíceps"),
  dict(name="Tríceps Corda",            en="triceps rope pushdown",       equip="Polia alta + corda",    inc=2.5, main=False, grupo="Tríceps"),
  dict(name="Tríceps Testa",            en="ez bar skull crusher",        equip="Barra W + banco",       inc=2,   main=False, grupo="Tríceps"),
  dict(name="Tríceps Francês Halter",   en="overhead dumbbell triceps extension", equip="Halter",        inc=2,   main=False, grupo="Tríceps"),
  # --- Core
  dict(name="Abdominal na Polia",       en="cable crunch",                equip="Polia alta + corda",    inc=2.5, main=False, grupo="Core"),
  dict(name="Elevação de Pernas na Barra", en="hanging knee raise",       equip="Barra fixa",            inc=0,   main=False, grupo="Core"),
  dict(name="Prancha",                  en="plank",                       equip="Colchonete",            inc=0,   main=False, grupo="Core"),
  dict(name="Prancha Lateral",          en="side plank",                  equip="Colchonete",            inc=0,   main=False, grupo="Core"),
  dict(name="Pallof Press",             en="pallof press",                equip="Polia ou elástico",     inc=2.5, main=False, grupo="Core"),
  # --- Cardio (sem carga)
  dict(name="Remo Ergômetro",           en="rowing machine",              equip="Remo (Concept2)",       inc=0,   main=False, grupo="Cardio"),
  dict(name="Escada (Stair Climber)",   en="stair climber",               equip="Simulador de escada (stair climber)", inc=0, main=False, grupo="Cardio"),
  # --- v2 (14/11/2026): postura, unilateral, peito alto
  dict(name="Remada Apoiada",           en="chest supported dumbbell row", equip="Halteres + banco inclinado", inc=2, main=False, grupo="Costas"),
  dict(name="Elevação em Y",            en="incline prone y raise",       equip="Halteres leves + banco inclinado", inc=1, main=False, grupo="Ombro posterior"),
  dict(name="Puxada Unilateral",        en="single arm lat pulldown",     equip="Polia alta + pegador",  inc=2.5, main=False, grupo="Costas"),
  dict(name="Landmine Press Unilateral",en="single arm landmine press",   equip="Barra no landmine + anilhas", inc=2.5, main=False, grupo="Ombro"),
  dict(name="Crossover Baixo-Alto",     en="low to high cable fly",       equip="Polia baixa dupla",     inc=2.5, main=False, grupo="Peito"),
  dict(name="Caminhada com Carga Unilateral", en="suitcase carry",       equip="Halter ou kettlebell (um lado)", inc=2, main=False, grupo="Core"),
  dict(name="Dead Bug",                 en="dead bug exercise",           equip="Colchonete",            inc=0, main=False, grupo="Core"),
  # --- aquecimento postural (sem registro de carga)
  dict(name="Recolher o Queixo",        en="chin tuck exercise",          equip="Parede",                inc=0, main=False, grupo="Aquecimento"),
  dict(name="Deslizamento na Parede",   en="wall slides shoulder",        equip="Parede",                inc=0, main=False, grupo="Aquecimento"),
  dict(name="Abertura com Elástico",    en="band pull apart",             equip="Elástico",              inc=0, main=False, grupo="Aquecimento"),
  dict(name="Alongamento do Peitoral na Porta", en="doorway pec stretch", equip="Batente da porta",      inc=0, main=False, grupo="Aquecimento"),
  dict(name="Extensão Torácica no Rolo",en="foam roller thoracic extension", equip="Rolo de espuma",     inc=0, main=False, grupo="Aquecimento"),
]
BY = {e["name"]: e for e in C}
