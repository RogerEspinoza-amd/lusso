$jsonContent = [System.IO.File]::ReadAllText('c:\Users\Usuario\Documents\LUSSO\initial_data.json', [System.Text.Encoding]::UTF8)
$data = $jsonContent | ConvertFrom-Json

$servicesCatalog = @(
    @{ id = "srv-1"; category = "manicure"; name = "Limpieza Manicure"; price = 35; duration = 30; description = "Limado de forma y largo + hidratacion rapida de manos. Sin esmalte."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-2"; category = "manicure"; name = "Manicure Infinite Shine"; price = 50; duration = 45; description = "Esmaltado tradicional de larga duracion + masaje relajante de manos. Sin lampara UV."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-3"; category = "manicure"; name = "Manicure Gel UV (Esmaltado)"; price = 60; duration = 60; description = "Best seller. Esmalte en gel curado en lampara UV, dura semanas intacto. Incluye retiro y aceite de cuticula."; specialist = "Cielo"; bestSeller = $true },
    @{ id = "srv-4"; category = "manicure"; name = "Rubber Gel (Refuerzo)"; price = 80; duration = 75; description = "Gel denso para reforzar unas debiles sin extension. Maxima resistencia natural."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-5"; category = "manicure"; name = "Unas Acrilicas"; price = 100; duration = 120; description = "Set completo de extension con polvo acrilico + monomero. Acabado duradero y estilizado."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-6"; category = "manicure"; name = "Unas Polygel"; price = 100; duration = 120; description = "Extension ligera, flexible e inodora. Aspecto ultra natural."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-7"; category = "manicure"; name = "Manicure Tradicional (OPI)"; price = 45; duration = 40; description = "Esmaltado clasico con esmaltes profesionales OPI sin gel."; specialist = "Cielo"; bestSeller = $false },
    
    @{ id = "srv-8"; category = "pedicure"; name = "Pedicure Premium"; price = 70; duration = 60; description = "Spa de pies con removedor de callos OPI ProSpa, exfoliacion profunda y esmaltado."; specialist = "Cielo"; bestSeller = $true },
    @{ id = "srv-9"; category = "pedicure"; name = "Pedicure Gel"; price = 60; duration = 50; description = "Esmaltado en gel de larga duracion en pies + hidratacion y aceite de cuticula."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-10"; category = "pedicure"; name = "Pedicure Tradicional (OPI)"; price = 50; duration = 45; description = "Spa de pies con sales relajantes, exfoliacion y esmalte tradicional OPI."; specialist = "Cielo"; bestSeller = $false },
    
    @{ id = "srv-11"; category = "corte"; name = "Corte de Puntas"; price = 50; duration = 30; description = "Despunte higienico sin perder largo. Incluye lavado, cepillado y aceite de argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-12"; category = "corte"; name = "Corte Tradicional"; price = 70; duration = 45; description = "Cambio de estilo o diseno de capas. Incluye lavado organico, masaje capilar, cepillado y argan."; specialist = "Kiara"; bestSeller = $true },
    @{ id = "srv-13"; category = "corte"; name = "Corte Lusso (Asesoria de Imagen)"; price = 80; duration = 60; description = "Corte premium con diagnostico visagistico personalizado + ritual de aceite de argan."; specialist = "Kiara"; bestSeller = $false },
    
    @{ id = "srv-14"; category = "color"; name = "Full Color"; price = 180; duration = 90; description = "Coloracion global uniforme con tintes Alfaparf. Incluye cepillado, ondas y argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-15"; category = "color"; name = "Mechas Morena Iluminada"; price = 199; duration = 180; description = "Efecto sutil y luminoso en tonos miel, avellana o caramelo. Incluye argan y corte de puntas."; specialist = "Kiara"; bestSeller = $true },
    @{ id = "srv-16"; category = "color"; name = "Mechas o Rubios Balayage / Babylights"; price = 299; duration = 240; description = "Tecnica de alta especializacion para rubios claros o platinados. Incluye matiz, corte y argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-17"; category = "color"; name = "Retoque de Raiz"; price = 80; duration = 60; description = "Tinte focalizado en raices con 100% cobertura de canas + sellado de argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-18"; category = "color"; name = "Bano de Color / Matiz"; price = 100; duration = 45; description = "Revitaliza y devuelve el brillo al tono sin decoloracion agresiva. Incluye cepillado."; specialist = "Kiara"; bestSeller = $false },
    
    @{ id = "srv-19"; category = "tratamientos"; name = "Botox Capilar / Bioplastia"; price = 150; duration = 90; description = "Reconstruccion profunda con aminoacidos y acido hialuronico para fibra danada."; specialist = "Kiara"; bestSeller = $true },
    @{ id = "srv-20"; category = "tratamientos"; name = "Nutricion & Hidratacion Profunda"; price = 150; duration = 75; description = "Terapia intensiva anti-edad capilar con evaluacion previa personalizada."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-21"; category = "tratamientos"; name = "Shot de Keratina"; price = 100; duration = 60; description = "Nutricion concentrada de sellado express con aceite de argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-22"; category = "tratamientos"; name = "Alisado Organico / Marroqui (Libre de Formol)"; price = 200; duration = 180; description = "Lacio perfecto y sedoso sin quimicos toxicos. Incluye corte de puntas y aceite de argan."; specialist = "Kiara"; bestSeller = $true },
    
    @{ id = "srv-23"; category = "tradicionales"; name = "Peinado Ondas / Trenzas Glam"; price = 80; duration = 50; description = "Peinado para eventos y sesiones con fijadores de acabado invisible."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-24"; category = "tradicionales"; name = "Aplicacion de Tinte (Cliente trae producto)"; price = 40; duration = 45; description = "Aplicacion profesional de tu propio tinte + lavado y aceite de argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-25"; category = "tradicionales"; name = "Lifting de Pestanas + Tinte"; price = 100; duration = 60; description = "Curvatura natural y tinte negro intenso en pestanas. Incluye perfilado de cejas de regalo."; specialist = "Cielo"; bestSeller = $true },
    @{ id = "srv-26"; category = "tradicionales"; name = "Planchado / Pigmento de Cejas"; price = 40; duration = 30; description = "Diseno morfologico, fijacion y sombreado semipermanente."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-27"; category = "tradicionales"; name = "Cepillado / Brushing"; price = 50; duration = 40; description = "Moldeado con volumen y movimiento sedoso + aceite de argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-28"; category = "tradicionales"; name = "Lavado y Secado"; price = 30; duration = 25; description = "Lavado relajante con champu botanico y secado basico."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-29"; category = "tradicionales"; name = "Planchado Liso Espejo"; price = 60; duration = 45; description = "Alisado termico temporal con protector termico y argan."; specialist = "Kiara"; bestSeller = $false },
    @{ id = "srv-30"; category = "tradicionales"; name = "Depilacion con Hilo - Bozo"; price = 25; duration = 15; description = "Tecnica milenaria higienica e hipoalergenica. Incluye gel descongestivo."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-31"; category = "tradicionales"; name = "Depilacion con Hilo - Cejas"; price = 25; duration = 20; description = "Diseno limpio y definido de cejas con hilo + gel calmante."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-32"; category = "tradicionales"; name = "Depilacion con Hilo - Rostro Completo"; price = 50; duration = 40; description = "Depilacion facial completa con hilo organico + mascarilla fria."; specialist = "Cielo"; bestSeller = $false },
    
    @{ id = "srv-33"; category = "retiros"; name = "Retiro de Gel UV"; price = 20; duration = 20; description = "Retiro cuidadoso sin limado agresivo para cuidar la placa ungueal."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-34"; category = "retiros"; name = "Retiro de Esmalte Tradicional"; price = 5; duration = 10; description = "Retiro con removedor humectante sin acetona pura."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-35"; category = "retiros"; name = "Cambio de Color Tradicional"; price = 25; duration = 25; description = "Retiro de esmalte anterior + aplicacion de nuevo esmalte tradicional."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-36"; category = "retiros"; name = "Retiro de Acrilicas"; price = 40; duration = 40; description = "Desprendimiento suave con solvente especializado y bano de aceite de cuticula."; specialist = "Cielo"; bestSeller = $false },
    @{ id = "srv-37"; category = "retiros"; name = "Retiro de Rubber Gel"; price = 30; duration = 30; description = "Retiro del refuerzo rubber manteniendo el grosor natural de la una."; specialist = "Cielo"; bestSeller = $false }
)

$initialInventory = @(
    @{ id = "inv-1"; name = "Tinte Alfaparf Evolution of the Color (Surtido)"; category = "Capilar"; brand = "Alfaparf Milano"; stock = 24; minStock = 8; unit = "Tubos 60ml"; cost = 28.5; supplier = "Alfaparf / Probela" },
    @{ id = "inv-2"; name = "Oxigenta Oxido Alfaparf 20 Vol / 30 Vol"; category = "Capilar"; brand = "Alfaparf Milano"; stock = 6; minStock = 3; unit = "Botellas 1L"; cost = 35.0; supplier = "Alfaparf" },
    @{ id = "inv-3"; name = "Decolorante BB Bleach High Lift 9 Tonos"; category = "Capilar"; brand = "Alfaparf Milano"; stock = 3; minStock = 2; unit = "Potes 400g"; cost = 95.0; supplier = "Alfaparf" },
    @{ id = "inv-4"; name = "Ampollas Reestructurantes Semi di Lino"; category = "Capilar"; brand = "Alfaparf Milano"; stock = 18; minStock = 6; unit = "Ampollas 13ml"; cost = 12.0; supplier = "Probela" },
    @{ id = "inv-5"; name = "Keratina Alisado Organico (Libre de Formol)"; category = "Capilar"; brand = "Lusso Care"; stock = 2; minStock = 2; unit = "Botellas 1L"; cost = 180.0; supplier = "Probela" },
    @{ id = "inv-6"; name = "Aceite Puro de Argan (Sello de la Casa)"; category = "Capilar"; brand = "Moroccanoil / Lusso"; stock = 4; minStock = 2; unit = "Botellas 100ml"; cost = 65.0; supplier = "Probela" },
    @{ id = "inv-7"; name = "Esmaltes OPI Tradicional (Colores Variados)"; category = "Unas"; brand = "OPI"; stock = 45; minStock = 12; unit = "Frascos 15ml"; cost = 24.0; supplier = "Probela" },
    @{ id = "inv-8"; name = "Gel UV Polish OPI / Gelcolor"; category = "Unas"; brand = "OPI"; stock = 28; minStock = 10; unit = "Frascos 15ml"; cost = 38.0; supplier = "Probela" },
    @{ id = "inv-9"; name = "Rubber Base Coat Nude & Clear"; category = "Unas"; brand = "Mia Secret / Kokoist"; stock = 5; minStock = 3; unit = "Frascos 15ml"; cost = 42.0; supplier = "Distribuidora Unas" },
    @{ id = "inv-10"; name = "Top Coat Gel No Wipe Ultra Brillo"; category = "Unas"; brand = "Mia Secret"; stock = 4; minStock = 2; unit = "Frascos 15ml"; cost = 32.0; supplier = "Distribuidora Unas" },
    @{ id = "inv-11"; name = "Removedor de Callos OPI ProSpa"; category = "Unas"; brand = "OPI"; stock = 2; minStock = 2; unit = "Botellas 118ml"; cost = 58.0; supplier = "Probela" },
    @{ id = "inv-12"; name = "Aceite de Cuticula ProSpa OPI"; category = "Unas"; brand = "OPI"; stock = 5; minStock = 2; unit = "Goteros 15ml"; cost = 29.0; supplier = "Probela" },
    @{ id = "inv-13"; name = "Limas de Unas Descartables 100/180"; category = "Descartables"; brand = "Generico Pro"; stock = 80; minStock = 30; unit = "Unidades"; cost = 1.2; supplier = "Distribuidora Unas" },
    @{ id = "inv-14"; name = "Toallas Desechables Spunlace"; category = "Descartables"; brand = "CleanPro"; stock = 120; minStock = 40; unit = "Unidades"; cost = 0.6; supplier = "Mercado Central / Probela" },
    @{ id = "inv-15"; name = "Guantes de Nitrilo Rosa (Talla S/M)"; category = "Descartables"; brand = "Cranberry"; stock = 2; minStock = 2; unit = "Cajas x100"; cost = 26.0; supplier = "Farmacia / Distribuidora" },
    @{ id = "inv-16"; name = "Agua Mineral Loa 1L / 500ml"; category = "Bebidas"; brand = "Loa"; stock = 8; minStock = 4; unit = "Botellas"; cost = 2.0; supplier = "Bodega / Metro" },
    @{ id = "inv-17"; name = "Cafe en Grano Premium Espresso"; category = "Bebidas"; brand = "Cafe Chanchamayo"; stock = 3; minStock = 1; unit = "Bolsas 500g"; cost = 28.0; supplier = "Supermercado" }
)

$teamMembers = @(
    @{
        id = "tm-1"
        name = "Kiara"
        role = "Estilista Master & Colorista"
        specialties = @("Corte & Visagismo", "Colorimetria & Mechas Balayage", "Tratamientos Capilares & Botox", "Alisados Organicos", "Peinados & Brushing")
        bio = "Especialista en transformacion y salud capilar con mas de 7 anos de experiencia. Su sello es el cuidado extremo de la fibra con aceite de argan y diagnosticos personalizados."
        avatar = "💇‍♀️"
    },
    @{
        id = "tm-2"
        name = "Cielo"
        role = "Nail Artist & Esteticista"
        specialties = @("Manicure Gel UV & Rubber", "Pedicure Spa Premium OPI", "Unas Acrilicas & Polygel", "Lifting de Pestanas & Cejas", "Depilacion con Hilo")
        bio = "Experta en diseno y salud de unas naturales y extensiones. Destacada por su prolijidad, higiene rigurosa y disenos en tendencia."
        avatar = "💅"
    }
)

$jsFileContent = "// Base de datos precargada y catalogos de LUSSO Salon Boutique`n"
$jsFileContent += "window.LUSSO_SEED_DATA = {`n"
$jsFileContent += "  clients: " + ($data.clients | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  sales: " + ($data.sales | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  pettyCash: " + ($data.pettyCash | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  invoices: " + ($data.invoices | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  servicesCatalog: " + ($servicesCatalog | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  inventory: " + ($initialInventory | ConvertTo-Json -Depth 5) + ",`n"
$jsFileContent += "  team: " + ($teamMembers | ConvertTo-Json -Depth 5) + "`n"
$jsFileContent += "};`n"

[System.IO.File]::WriteAllText('c:\Users\Usuario\Documents\LUSSO\js\data.js', $jsFileContent, [System.Text.Encoding]::UTF8)
Write-Output "js/data.js generated successfully!"
