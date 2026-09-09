/**
 * Catálogo de Metadatos y Metodología de Cálculo de Indicadores de TrazAlga
 * Diseñado para usuarios de negocio y técnicos.
 */

export const INDICADORES_METADATA = {
  // =========================================================================
  // 1. KPIS EJECUTIVOS (STAT CARDS)
  // =========================================================================

  declaracionesTotales: {
    id: 'declaracionesTotales',
    codigo: 'KPI-01',
    nombre: 'Declaraciones Totales',
    categoria: 'KPI Ejecutivo Global',
    subtitulo: 'Toda la cadena de suministro de algas pardas',
    icono: 'BarChart',
    color: '#0ea5e9',
    resumenNegocio:
      'Mide el volumen bruto de actividad documental procesada en la plataforma durante el período seleccionado. Cada declaración constituye un instrumento legal obligatorio de trazabilidad exigido por Sernapesca para amparar el origen, transporte, comercialización y transformación de algas pardas.',
    metricaBase: 'Conteo transaccional de registros únicos (unidades de documentos emitidos).',
    humedadFactor:
      'Aplica transversalmente a todos los estados de humedad registrados (Húmedo, Semiseco, Seco, Picado, etc.) sin distinción física.',
    fuentesDatos:
      'Unión de todas las tablas declarativas: `declaracion_recolector`, `declaracion_armador`, `declaracion_area`, `declaracion_comercializador`, `declaracion_planta_abastecimiento`, `declaracion_planta_produccion`, `declaracion_planta_destino`.',
    periodoFechas:
      'Filtrado por el campo de fecha declarada (`fecha_declaracion` o fecha de ingreso a planta) dentro del rango temporal seleccionado en el panel superior.',
    formula: 'COUNT(id_declaracion) WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion:
      'Permite dimensionar la cobertura de fiscalización activa e identificar aumentos atípicos en la emisión de documentos por zona, caleta o temporada.',
    preguntasFrecuentes: [
      {
        pregunta: '¿Incluye declaraciones observadas o en negociación?',
        respuesta: 'Sí, contabiliza todas las declaraciones emitidas, independientemente de si presentan alertas o están en revisión.'
      },
      {
        pregunta: '¿1 declaración equivale a 1 viaje de pesca?',
        respuesta: 'Para armadores sí (1 declaración de armador = 1 viaje/recalada). Para recolectores equivale a 1 jornada de orilla.'
      }
    ]
  },

  volumenTotal: {
    id: 'volumenTotal',
    codigo: 'KPI-02',
    nombre: 'Volumen Total Declarado (kg)',
    categoria: 'KPI Ejecutivo Global',
    subtitulo: 'Desembarque físico directo en costa',
    icono: 'Inventory',
    color: '#10b981',
    resumenNegocio:
      'Representa el tonelaje físico total de algas desembarcadas en costa por recolectores de orilla, armadores de embarcaciones y organizaciones titulares de Áreas de Manejo (AMERB). Es la masa en bruto registrada al momento de la extracción.',
    metricaBase: '**Desembarque Físico** (peso en báscula en kilogramos netos). No aplica factor biológico correctivo.',
    humedadFactor:
      'Suma los kilogramos físicos tal cual fueron pesados en playa o caleta, predominantemente en estado Húmedo (alga fresca) o Semilavado.',
    fuentesDatos:
      'Campos `desembarque` de las tres tablas primarias de extracción: `declaracion_recolector`, `declaracion_armador` y `declaracion_area`.',
    periodoFechas:
      'Filtrado por `fecha_declaracion` comprendida entre la fecha de inicio y fin del selector activo.',
    formula: 'SUM(r.desembarque) + SUM(a.desembarque) + SUM(am.desembarque) WHERE fecha BETWEEN :startDate AND :endDate',
    criterioFiscalizacion:
      'Es la magnitud base para balancear la masa que luego ingresa a comercializadores y plantas. Cualquier diferencia con el volumen comprado posterior debe responder a mermas por deshidratación justificadas.',
    preguntasFrecuentes: [
      {
        pregunta: '¿Por qué no coincide con la Captura Corregida?',
        respuesta: 'Porque el Desembarque Físico es el peso en balanza, mientras que la Captura Corregida multiplica el peso seco o semiseco por el factor biológico oficial para estimar el alga viva extraída.'
      }
    ]
  },

  alertasActivas: {
    id: 'alertasActivas',
    codigo: 'KPI-03',
    nombre: 'Alertas Activas de Fiscalización',
    categoria: 'Control Normativo y Cumplimiento',
    subtitulo: 'Infracciones no subsanadas o en curso',
    icono: 'WarningAmber',
    color: '#f59e0b',
    resumenNegocio:
      'Total de infracciones o discrepancias operativas identificadas automáticamente por el motor de reglas de TrazAlga en el período que requieren intervención de inspectores o fiscalizadores Sernapesca.',
    metricaBase: 'Conteo de declaraciones con flags de alerta activas (estado != RESUELTO o SUBSANADO).',
    humedadFactor:
      'Relevante para el análisis de variación de peso y mermas en ruta, donde la pérdida de peso se evalúa en función del estado de humedad y los días de traslado.',
    fuentesDatos:
      'Motor de fiscalización evaluando cruces contra `veda_especie`, `cuota_extraccion`, `limite_extraccion_diario_config` y comparaciones de cadena de custodia.',
    periodoFechas:
      'Declaraciones emitidas dentro del rango activo que mantienen una condición de alerta abierta.',
    formula: 'COUNT(*) WHERE alertas_activas > 0 AND estado_caso != "RESUELTO"',
    criterioFiscalizacion:
      'Marcas oficiales de fiscalización emitidas en declaraciones: EN_VEDA (recurso en veda activa), LED_EXCEDIDO (tope diario por embarcación rebasado), DESEMBARQUE_ATIPICO (desembarque fuera del rango estadístico normal), CUOTA_EXCEDIDA (cuota territorial agotada) y POSTERIOR_CIERRE (declaración extemporánea tras cierre formal). Las discrepancias de variación de peso y retención en bodega se auditan en sus reportes y widgets especializados.',
    preguntasFrecuentes: [
      {
        pregunta: '¿Una declaración puede tener más de una alerta?',
        respuesta: 'Sí, pero en este KPI se cuenta la declaración como 1 caso con alertas activas.'
      }
    ]
  },

  casosAbiertosKPI: {
    id: 'casosAbiertosKPI',
    codigo: 'KPI-04',
    nombre: 'Casos Abiertos',
    categoria: 'Gestión de Fiscalización',
    subtitulo: 'Declaraciones retenidas o en negociación',
    icono: 'Inventory',
    color: '#8b5cf6',
    resumenNegocio:
      'Representa las declaraciones que se encuentran retenidas en la bodega virtual o en proceso de controversia entre compradores y vendedores (ej. por diferencias de pesaje en báscula de planta).',
    metricaBase: 'Cantidad de declaraciones en estados de excepción operativa.',
    humedadFactor: 'Influye directamente en las disputas de peso por humedad entre recolector y comercializador.',
    fuentesDatos: 'Registros de declaraciones donde el campo `estado` es EN_NEGOCIACION, RECHAZADA u OBSERVADA.',
    periodoFechas: 'Declaraciones registradas en el período seleccionado que aún no cuentan con finiquito o visado.',
    formula: 'COUNT(id) WHERE estado IN ("EN_NEGOCIACION", "RECHAZADA", "OBSERVADA")',
    criterioFiscalizacion:
      'Permite auditar los cuellos de botella en la recepción de plantas y los acuerdos de pesaje entre pescadores e intermediarios.'
  },

  inconsistenciasPct: {
    id: 'inconsistenciasPct',
    codigo: 'KPI-05',
    nombre: '% de Inconsistencias',
    categoria: 'Riesgo y Cumplimiento',
    subtitulo: 'Tasa porcentual de infracciones',
    icono: 'BarChart',
    color: '#ef4444',
    resumenNegocio:
      'Proporción porcentual de declaraciones con anomalías normativas o rechazos respecto al total de declaraciones de extracción procesadas en el período.',
    metricaBase: 'Porcentaje calculado con 1 decimal (0% es el valor ideal).',
    humedadFactor: 'No aplica directamente; se deriva de las alertas consolidadas.',
    fuentesDatos: 'Cociente entre el total de declaraciones observadas/en veda y las declaraciones de extracción de origen.',
    periodoFechas: 'Calculado sobre las operaciones registradas en el rango temporal activo.',
    formula: '(Total Declaraciones con Infracción / Total Declaraciones de Extracción) * 100',
    criterioFiscalizacion:
      'Una tasa superior al 3% enciende advertencia preventiva; valores sobre 5% indican zonas o caletas con riesgo crítico de fiscalización.'
  },

  actoresFiscalizados: {
    id: 'actoresFiscalizados',
    codigo: 'KPI-06',
    nombre: 'Actores Fiscalizados',
    categoria: 'Población y Cobertura',
    subtitulo: 'Usuarios únicos con actividad',
    icono: 'Group',
    color: '#0ea5e9',
    resumenNegocio:
      'Cantidad única de personas naturales o jurídicas (recolectores, armadores, organizaciones AMERB y comercializadores) que registraron al menos una transacción en el período.',
    metricaBase: 'Conteo de Identificadores únicos (`usuario_id` / RUT).',
    humedadFactor: 'No aplica.',
    fuentesDatos: 'Campo `usuario_id` en las tablas de declaraciones activas.',
    periodoFechas: 'Usuarios con al menos un documento fechado en el rango seleccionado.',
    formula: 'COUNT(DISTINCT usuario_id) FROM declaraciones WHERE fecha BETWEEN :startDate AND :endDate',
    criterioFiscalizacion:
      'Permite constatar la penetración del sistema digital frente al padrón oficial del Registro Pesquero Artesanal (RPA).'
  },

  declRecolector: {
    id: 'declRecolector',
    codigo: 'KPI-07',
    nombre: 'Declaraciones de Recolector (Orilla)',
    categoria: 'Perfil Recolector de Orilla',
    subtitulo: 'Documentos de recolección pedestre',
    icono: 'Inventory',
    color: '#3b82f6',
    resumenNegocio:
      'Documentos emitidos por personas naturales habilitadas en el Registro Pesquero Artesanal en la categoría de Recolector de Orilla, Alguero o Buzo Apneista.',
    metricaBase: 'Conteo de registros en la tabla `declaracion_recolector`.',
    humedadFactor: 'Comprende el desembarque físico de algas recogidas o segadas en la franja intermareal.',
    fuentesDatos: 'Tabla `declaracion_recolector`.',
    periodoFechas: '`fecha_declaracion` dentro del rango temporal activo.',
    formula: 'COUNT(id) FROM declaracion_recolector WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion: 'Monitorea la presión extractiva en la franja de orilla por caleta.'
  },

  viajesArmador: {
    id: 'viajesArmador',
    codigo: 'KPI-08',
    nombre: 'Nº Viajes / Faenas de Armador',
    categoria: 'Perfil Embarcación Artesanal',
    subtitulo: '1 declaración = 1 recalada / viaje',
    icono: 'DirectionsBoat',
    color: '#0891b2',
    resumenNegocio:
      'Total de recaladas o viajes de pesca declarados por embarcaciones artesanales algueras. Conforme a la reglamentación pesquera de Sernapesca, cada declaración de armador ampara exactamente un viaje o faena de pesca.',
    metricaBase: 'Conteo de viajes (`declaracion_armador`). Incluye cálculo de promedio diario: `Total Viajes / Días del Período`.',
    humedadFactor: 'Asociado al desembarque por buceo con embarcación o extracción submareal.',
    fuentesDatos: 'Tabla `declaracion_armador`.',
    periodoFechas: '`fecha_declaracion` en el rango activo.',
    formula: 'COUNT(id) FROM declaracion_armador WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion: 'Controla el esfuerzo pesquero de la flota artesanal por área de operación.'
  },

  declArea: {
    id: 'declArea',
    codigo: 'KPI-09',
    nombre: 'Declaraciones de Área de Manejo (AMERB)',
    categoria: 'Perfil Organización AMERB',
    subtitulo: 'Extracciones bajo Plan de Manejo oficial',
    icono: 'Inventory',
    color: '#3b82f6',
    resumenNegocio:
      'Declaraciones emitidas por organizaciones de pescadores artesanales titulares de Áreas de Manejo y Explotación de Recursos Bentónicos autorizadas mediante decreto de Subpesca.',
    metricaBase: 'Conteo de registros en `declaracion_area`.',
    humedadFactor: 'Explotación programada según el estudio de situación base anual (ESBA).',
    fuentesDatos: 'Tabla `declaracion_area` validada contra `amerb_especie_habilitada`.',
    periodoFechas: '`fecha_declaracion` en el rango activo.',
    formula: 'COUNT(id) FROM declaracion_area WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion: 'Garantiza que sólo se extraigan especies habilitadas expresamente por resolución técnica.'
  },

  declComercializador: {
    id: 'declComercializador',
    codigo: 'KPI-10',
    nombre: 'Declaraciones de Comercializador',
    categoria: 'Perfil Comercializador Intermedio',
    subtitulo: 'Traspasos y operaciones de acopio',
    icono: 'Inventory',
    color: '#8b5cf6',
    resumenNegocio:
      'Traspasos, compras y ventas intermedios registrados por agentes comercializadores acreditados antes de la entrega final a plantas de procesamiento o exportación.',
    metricaBase: 'Conteo de registros en `declaracion_comercializador`.',
    humedadFactor: 'Transición física frecuente de alga húmeda a semiseco o seco en canchas de secado.',
    fuentesDatos: 'Tabla `declaracion_comercializador`.',
    periodoFechas: '`fecha_declaracion` en el rango activo.',
    formula: 'COUNT(id) FROM declaracion_comercializador WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion: 'Esencial para vincular el alga desembarcada en playa con el ingreso a bodegas intermedias.'
  },

  volumenComprado: {
    id: 'volumenComprado',
    codigo: 'KPI-11',
    nombre: 'Volumen Comprado por Comercializadores (kg)',
    categoria: 'Flujo Comercial Intermedio',
    subtitulo: 'Kilogramos adquiridos en el período',
    icono: 'Inventory',
    color: '#8b5cf6',
    resumenNegocio:
      'Masa neta física en kilogramos adquirida por comercializadores intermediarios a recolectores, armadores o AMERB. Provee además el promedio diario en kg/día.',
    metricaBase: '**Desembarque / Compra Física (kg)** campo `cantidad` en `declaracion_comercializador`.',
    humedadFactor: 'Reportado según el estado de humedad convenido en la transacción comercial.',
    fuentesDatos: 'Campo `cantidad` en `declaracion_comercializador`.',
    periodoFechas: 'Filtrado por `fecha_declaracion` en el rango temporal activo.',
    formula: 'SUM(cantidad) FROM declaracion_comercializador WHERE fecha_declaracion BETWEEN :startDate AND :endDate',
    criterioFiscalizacion: 'Permite contrastar si el volumen comprado supera el volumen desembarcado en la misma zona geográfica.'
  },

  // =========================================================================
  // 2. INDICADORES PRINCIPALES / WIDGETS ESPECIALIZADOS
  // =========================================================================

  evolucionDesembarque: {
    id: 'evolucionDesembarque',
    codigo: 'GRAF-01',
    nombre: 'Evolución de Declaraciones y Desembarques',
    categoria: 'Dinámica Temporal y Estacional',
    subtitulo: 'Serie de tiempo diaria de actividad y volumen físico',
    icono: 'BarChart',
    color: '#0ea5e9',
    resumenNegocio:
      'Monitorea la curva diaria de extracción física frente a la cantidad de operaciones declaradas, permitiendo detectar picos inusuales de actividad, temporadas de marejadas o aperturas de cuota masivas.',
    metricaBase: 'Contrasta **Nº de Declaraciones Diarias** versus **Desembarque Físico Diario (kg)**.',
    humedadFactor: 'Agrupa el peso físico directo registrado en playa.',
    fuentesDatos: 'Agrupación de `declaracion_recolector`, `declaracion_armador` y `declaracion_area`.',
    periodoFechas: 'Agrupado por cada día calendario (`DATE(fecha_declaracion)`) en el rango seleccionado.',
    formula: 'SELECT fecha_declaracion, COUNT(id) AS decl, SUM(desembarque) AS kg GROUP BY fecha_declaracion',
    criterioFiscalizacion: 'Facilita la detección de concentraciones atípicas de esfuerzo pesquero en caletas específicas.'
  },

  desembarqueFisico: {
    id: 'desembarqueFisico',
    codigo: 'IND-01',
    nombre: 'Indicador 1: Desembarque Físico por Especie y Humedad',
    categoria: 'Indicador Oficial Sernapesca',
    subtitulo: 'Kilogramos reales pesados en báscula de costa por caleta, persona, especie y territorio',
    icono: 'Scale',
    color: '#0ea5e9',
    resumenNegocio:
      'Mide la masa física bruta en kilogramos pesada al momento del desembarque en playa o caleta. Es la métrica obligatoria para registrar la cantidad física real que declara y tranza el recolector o embarcación en costa, y para monitorear tendencias de volumen por caleta o persona, así como por comuna, provincia y especie.',
    metricaBase: '**Desembarque Físico (kg)** directo en báscula. No aplica factores biológicos de conversión.',
    humedadFactor:
      'Clasifica el alga en sus estados de humedad: Húmedo (alga fresca con agua de mar), Semiseco (secado parcial en canchas), Seco (deshidratada al sol, apta para molienda).',
    fuentesDatos: 'Campos `desembarque`, `especie_id`, `humedad_estado_id`, `caleta_id`, `usuario_id` en Recolector, Armador y Área de Manejo (AMERB).',
    periodoFechas: 'Declaraciones registradas dentro del rango temporal seleccionado.',
    formula: 'SUM(desembarque) GROUP BY caleta_id, usuario_id, especie_id, humedad_estado_id (con agregación por comuna y provincia)',
    criterioFiscalizacion:
      'Permite monitorear tendencias de volumen por caleta y por pescador. Aplica detección estadística de desembarques atípicos: si un desembarque supera en más de 2.5 desviaciones estándar el promedio histórico del perfil en esa comuna o caleta, o rebasa el umbral configurable de {{desembarque_umbral_atipico_kg:5000}} kg (`desembarque_umbral_atipico_kg`), se etiqueta con la marca oficial DESEMBARQUE_ATIPICO.'
  },

  capturaCorregida: {
    id: 'capturaCorregida',
    codigo: 'IND-02',
    nombre: 'Indicador 2: Captura Biológica Corregida',
    categoria: 'Indicador Biológico Oficial',
    subtitulo: 'Equivalente biológico de alga viva extraída',
    icono: 'Science',
    color: '#10b981',
    resumenNegocio:
      'Convierte los kilogramos físicos desembarcados en el equivalente biológico de alga viva extraída del mar. Esta conversión es indispensable para la sustentabilidad: al secarse el alga pierde agua, por lo que 1 kg de alga seca equivale a 3,58 kg de captura biológica viva extraída del ecosistema marino.',
    metricaBase: '**Captura Biológica Corregida (kg)**. Es la métrica de uso obligatorio para el descuento y control de las cuotas de extracción decretadas por Subpesca.',
    humedadFactor:
      'Multiplica el desembarque físico por el Factor de Conversión Oficial vigente para la especie y el estado de humedad (por ejemplo, con alga seca el factor oficial vigente es 3,58: 1.000 kg físicos secos equivalen a 3.580 kg de captura biológica; en húmedo factor 1,0). Si una declaración no cuenta con factor vigente, se aplica la política `{{captura_politica_sin_factor:USAR_DEFAULT}}` con factor de respaldo {{captura_factor_default:1.0000}} (`captura_factor_default`). Los factores se administran en el mantenedor de Factores de Conversión y tienen vigencia por fecha, de modo que una declaración antigua siempre se recalcula con el factor que regía ese día.',
    fuentesDatos: 'Tabla `factor_conversion` cruzada con las declaraciones de origen.',
    periodoFechas: 'Fecha de la extracción/declaración confrontada con la vigencia temporal del factor de conversión.',
    formula: 'Captura Biológica = Desembarque Físico (kg) × Factor de Conversión Vigente',
    criterioFiscalizacion:
      'El factor aplicado queda congelado en los campos `factor_aplicado` (DECIMAL 8,4) y `factor_conversion_id` de cada declaración. Esto garantiza inviolabilidad histórica: si Subpesca modifica un factor en el futuro, las declaraciones anteriores conservan inalterado su valor legal de auditoría.'
  },

  controlCuotas: {
    id: 'controlCuotas',
    codigo: 'IND-03',
    nombre: 'Indicador 3: Control de Cuotas y Saldos (Concurrente)',
    categoria: 'Gestión de Cuotas y Techos Legales',
    subtitulo: 'Monitoreo concurrentemente jerárquico en 7 niveles',
    icono: 'Scale',
    color: '#8b5cf6',
    resumenNegocio:
      'Monitorea el consumo acumulado frente a los techos legales decretados por Subpesca. Implementa la arquitectura de evaluación concurrente: una declaración debe cumplir simultáneamente con todas las cuotas que la cubren (Comunal, Provincial, Regional, Macrozonal y Nacional).',
    metricaBase:
      'Descuenta según la métrica legal de la cuota: **Captura Biológica Corregida** (obligatoria por norma) o **Desembarque Físico** (sólo si la resolución técnica lo explicita expresamente). Imputa a la comuna de inscripción del declarante.',
    humedadFactor:
      'Si la cuota evalúa Captura, se descuenta el equivalente biológico corregido por el factor de humedad de cada especie (seco = 3,58, húmedo = 1,0). Si el límite nominal de la cuota se fijó en peso seco, el sistema calcula el límite efectivo multiplicándolo por el factor correspondiente.',
    fuentesDatos:
      'Tabla `cuota_extraccion`, cruzada con las declaraciones de extracción y la tabla de membresía multirregional `macrozona_region`.',
    periodoFechas: 'Período legal de la cuota (Diario, Mensual, Anual) confrontado con el rango activo.',
    formula: 'Consumo Acumulado = SUM(captura_o_desembarque) imputado territorialmente vs Límite Efectivo de Cuota (kg)',
    criterioFiscalizacion:
      'La cuota con mayor porcentaje de uso define el "cuello de botella". El sistema emite alerta preventiva cuando el saldo restante es inferior al {{cuota_umbral_restante_pct:10.0}}% (`cuota_umbral_restante_pct`), alerta de velocidad si el ritmo de consumo supera en más de {{cuota_desvio_velocidad_pct:25.0}}% (`cuota_desvio_velocidad_pct`) el tiempo transcurrido, y aviso de expiración a los {{cuota_dias_previos_expiracion:5}} días previos al fin de vigencia. Si alguna cuota aplicable se agota o está CERRADA y tiene política BLOQUEO_DECLARACION, el sistema rechaza la declaración con código HTTP 422, informando la cuota rectora causante del bloqueo.'
  },

  limiteDiarioLed: {
    id: 'limiteDiarioLed',
    codigo: 'IND-04',
    nombre: 'Indicador 4: Límite de Extracción Diario (LED)',
    categoria: 'Control de Esfuerzo Pesquero',
    subtitulo: 'Tope diario por embarcación artesanal (configurable por buzo o recolector)',
    icono: 'Speed',
    color: '#f59e0b',
    resumenNegocio:
      'Fiscaliza que una embarcación artesanal no supere en un solo día el volumen físico máximo diario autorizado por resolución oficial (por ejemplo, la regla oficial de 2.000 kg/día de Desembarque para Huiro Palo Barreteado a nivel nacional). El sistema también admite configurar reglas por buzo o recolector si la autoridad lo determina.',
    metricaBase: 'Suma diaria de **Desembarque Físico (kg)** (métrica oficial por norma) para una misma fecha y unidad de agregación (`embarcacion_id`).',
    humedadFactor: 'Evaluado en Desembarque Físico directo en balanza conforme a la regla oficial validada por Sernapesca (configurable a Captura si una resolución particular lo especifica).',
    fuentesDatos: 'Tabla `limite_extraccion_diario_config` cruzada con declaraciones de Armador (embarcación) o Recolector.',
    periodoFechas: 'Agrupado por día exacto (`fecha_declaracion = :fecha`).',
    formula: 'SUM(desembarque) WHERE embarcacion_id = :embarcacion AND fecha_declaracion = :fecha vs Limite LED (kg) + Tolerancia %',
    criterioFiscalizacion:
      'Por defecto la tolerancia es 0% (`margen_tolerancia_pct = 0.0`). Si una declaración excede el límite oficial diario asignado a la embarcación, el motor aplica la acción configurada: marca oficial `LED_EXCEDIDO` en modo SOLO_ALERTA o rechazo HTTP 422 en modo BLOQUEO_DECLARACION.'
  },

  controlVedas: {
    id: 'controlVedas',
    codigo: 'IND-05',
    nombre: 'Indicador 5: Control de Vedas Biológicas',
    categoria: 'Protección Reproductiva',
    subtitulo: 'Respeto a períodos de veda biológica decretados',
    icono: 'Gavel',
    color: '#ef4444',
    resumenNegocio:
      'Detecta y bloquea extracciones no autorizadas realizadas durante períodos de veda decretados por la autoridad para resguardar las épocas críticas de reproducción y reclutamiento del alga parda.',
    metricaBase: 'Verificación multidimensional de coincidencia: especie, región, método de extracción y fecha de faena.',
    humedadFactor: 'Aplica a cualquier estado de humedad del recurso protegido.',
    fuentesDatos: 'Tabla `veda_especie` cruzada con `declaracion_recolector`, `declaracion_armador` y `declaracion_area`.',
    periodoFechas: 'Fecha de extracción de la declaración interceptada con `[fecha_inicio, fecha_fin]` o evaluada en `meses_veda` para vedas con recurrencia anual.',
    formula: 'Coincidencia por especie + región + método de extracción + fecha de extracción. Aplica por rango de fechas (`fecha_inicio`–`fecha_fin`) o recurrencia anual (`meses_veda`). Campos NULL actúan como comodines nacionales o de método.',
    criterioFiscalizacion:
      'Emite aviso preventivo con {{veda_dias_aviso_previo:7}} días de anticipación (`veda_dias_aviso_previo`). Si la veda opera en modo BLOQUEO_ESTRICTO (modo activo: `{{veda_modo_operacion:BLOQUEO_ESTRICTO}}`), el sistema rechaza la declaración impidiendo su emisión (HTTP 422); si opera en modo ALERTA_FISCALIZACION, permite registrar la declaración asignándole la marca oficial EN_VEDA para notificación inmediata a los fiscalizadores.'
  },

  variacionPeso: {
    id: 'variacionPeso',
    codigo: 'IND-06',
    nombre: 'Indicador 6: Trazabilidad de Peso y Variación en Ruta',
    categoria: 'Cadena de Custodia y Balances',
    subtitulo: 'Comparación peso origen vs peso recepción en comprador',
    icono: 'CompareArrows',
    color: '#06b6d4',
    resumenNegocio:
      'Compara el peso declarado por el pescador en origen frente al peso registrado por comercializadores y plantas en la recepción de la carga. Reconstruye la cadena completa para detectar deshidratación natural, mermas físicas justificadas o blanqueo de algas agregadas en el trayecto.',
    metricaBase: 'Variación porcentual de peso físico en cada tramo de custodia: `((Peso Recepción - Peso Origen) / Peso Origen) * 100`.',
    humedadFactor:
      'Diferencia el comportamiento según estado de humedad de origen y días de tránsito: para alga húmeda con más de {{bio_humedo_dias_minimos_transito:3}} días de traslado (`bio_humedo_dias_minimos_transito`) se exige una merma mínima del {{bio_humedo_merma_minima_pct:5.0}}% (`bio_humedo_merma_minima_pct`) por deshidratación natural; para alga seca la tolerancia de variación máxima es de {{bio_seco_merma_maxima_pct:3.0}}% (`bio_seco_merma_maxima_pct`).',
    fuentesDatos:
      'Reconstrucción de la cadena de custodia de tres puntos vinculada por `folio_origen`: Origen (recolector/armador/área) → Comercializador Intermedio → Planta de Procesamiento.',
    periodoFechas: 'Declaraciones vinculadas procesadas en el período seleccionado.',
    formula: 'Variación % = ((desembarque_receptor - desembarque_emisor) / desembarque_emisor) × 100 evaluada junto con días de tránsito y estado de humedad de origen.',
    criterioFiscalizacion:
      'Evalúa la variación frente al umbral general (`variacion_peso_umbral_general_pct`, {{variacion_peso_umbral_general_pct:5.0}}%) y las reglas biológicas específicas por humedad (control gobernado por el interruptor maestro `bio_perdida_activo`). Discrepancias anómalas (como incrementos de peso en ruta o alga húmeda que no merma tras varios días) se reportan en el widget y abren auditoría sobre el transporte, sin generar una marca de base de datos directa.'
  },

  retencionBodega: {
    id: 'retencionBodega',
    codigo: 'IND-07',
    nombre: 'Retención en Bodega Virtual',
    categoria: 'Inventario y Almacenamiento',
    subtitulo: 'Antigüedad de stock acopiado sin movimiento comercial',
    icono: 'Inventory2',
    color: '#8b5cf6',
    resumenNegocio:
      'Controla los tiempos de permanencia de lotes de alga en bodegas intermedias de comercializadores o plantas procesadoras, evitando el acopio clandestino o la acumulación especulativa.',
    metricaBase: 'Días transcurridos desde el ingreso del lote a bodega: `DATEDIFF(HOY, fecha_ingreso)`.',
    humedadFactor: 'Relevante para evaluar la merma progresiva por secado prolongado en canchas.',
    fuentesDatos: 'Registros de inventario de `declaracion_comercializador` y plantas de abastecimiento.',
    periodoFechas: 'Lotes con saldo disponible en inventario a la fecha actual.',
    formula: 'Días Retención = CURRENT_DATE - fecha_ingreso_bodega',
    criterioFiscalizacion:
      'El control es de tres niveles y sus umbrales se configuran en Administración → Configuración General → Cadena de Custodia: alerta amarilla preventiva a los {{retencion_bodega_dias_amarilla:3}} días (`retencion_bodega_dias_amarilla`), naranja crítica a los {{retencion_bodega_dias_naranja:5}} días (`retencion_bodega_dias_naranja`) y roja al superar el plazo máximo recomendado de {{retencion_bodega_dias_roja:7}} días (`retencion_bodega_dias_roja`). Aplica a los estados de humedad indicados en `retencion_bodega_estados_sujetos` (por defecto, sólo {{retencion_bodega_estados_sujetos:HÚMEDO}}), gobernado por el switch maestro `retencion_bodega_activo`.'
  },

  tiempoValidacion: {
    id: 'tiempoValidacion',
    codigo: 'IND-08',
    nombre: 'Tiempo de Validación y Procesamiento',
    categoria: 'Eficiencia Operativa',
    subtitulo: 'Latencia entre emisión en costa y recepción visada',
    icono: 'AccessTime',
    color: '#3b82f6',
    resumenNegocio:
      'Mide la agilidad y fluidez de la cadena documental, cuantificando cuántas horas transcurren desde que el recolector emite su declaración en playa hasta que el destinatario la valida en sistema.',
    metricaBase: 'Horas y minutos transcurridos (`created_at_destino - created_at_origen`).',
    humedadFactor: 'No aplica.',
    fuentesDatos: 'Diferencia de marcas de tiempo en las declaraciones vinculadas de la cadena.',
    periodoFechas: 'Transacciones cerradas en el rango de fechas seleccionado.',
    formula: 'Promedio Horas = AVG(TIMESTAMPDIFF(HOUR, created_at_origen, created_at_destino))',
    criterioFiscalizacion:
      'Tiempos superiores a 48 horas sugieren retrasos en la formalización o transporte no visado en ruta.'
  },

  casosAbiertos: {
    id: 'casosAbiertos',
    codigo: 'IND-09',
    nombre: 'Casos Abiertos de Fiscalización (Detalle)',
    categoria: 'Auditoría Legal Sernapesca',
    subtitulo: 'Expedientes con medidas cautelares o controversias',
    icono: 'FolderOpen',
    color: '#f59e0b',
    resumenNegocio:
      'Listado interactivo de todas las incidencias abiertas clasificadas por su tipología legal (infracción de veda, exceso de cuota, discrepancia de peso o retención excesiva de stock).',
    metricaBase: 'Conteo y estado de expedientes jurídicos o administrativos.',
    humedadFactor: 'Asociado al motivo específico de cada caso.',
    fuentesDatos: 'Módulo de casos de fiscalización y alertas activas del sistema.',
    periodoFechas: 'Casos generados en el período que permanecen sin resolución definitiva.',
    formula: 'SELECT motivo, COUNT(*) FROM casos_abiertos GROUP BY motivo',
    criterioFiscalizacion:
      'Herramienta de control para los directores regionales de Sernapesca y coordinadores de fiscalización.'
  },

  dobleOperacion: {
    id: 'dobleOperacion',
    codigo: 'IND-10',
    nombre: 'Control de Doble Operación / Superposición',
    categoria: 'Georreferenciación y Presencialidad',
    subtitulo: 'Detección de faenas incompatibles en el mismo día',
    icono: 'MergeType',
    color: '#ef4444',
    resumenNegocio:
      'Identifica anomalías donde un mismo recolector o embarcación artesanal declara haber operado simultáneamente en caletas geográficamente distantes el mismo día, o emite declaraciones consecutivas con tiempos de navegación físicamente imposibles.',
    metricaBase: 'Detección de colisiones espaciotemporales de un mismo actor en la misma fecha.',
    humedadFactor: 'No aplica.',
    fuentesDatos: 'Cruce cruzado de `declaracion_recolector` y `declaracion_armador` por `usuario_id` y `fecha_declaracion`.',
    periodoFechas: 'Declaraciones registradas dentro del rango temporal seleccionado.',
    formula: 'COUNT(*) WHERE usuario_id = :id AND fecha = :f AND COUNT(DISTINCT comuna_id) > 1',
    criterioFiscalizacion:
      'Previene el préstamo de RUT o la falsificación de declaraciones para blanquear algas de origen ilícito.'
  },

  curvaSnake: {
    id: 'curvaSnake',
    codigo: 'IND-11',
    nombre: 'Curva Snake Acumulada (AMERB)',
    categoria: 'Seguimiento de Planes de Manejo AMERB',
    subtitulo: 'Avance acumulado real vs planificado por resolución',
    icono: 'Timeline',
    color: '#10b981',
    resumenNegocio:
      'Proyecta el avance de la extracción biológica real acumulada en un Área de Manejo frente al calendario mensual del Plan de Manejo aprobado por resolución de Subpesca, visualizando la "curva snake" de sostenibilidad.',
    metricaBase: 'Captura Biológica Corregida acumulada (kg) vs Cuota Total decretada para el AMERB.',
    humedadFactor: 'Calculado en equivalente biológico alga viva con factor de conversión oficial.',
    fuentesDatos: 'Tabla `declaracion_area` cruzada con la cuota específica asignada al AMERB.',
    periodoFechas: 'Acumulado progresivo desde el inicio de la temporada pesquera anual.',
    formula: 'Curva Real = SUM(captura_corregida) acumulada vs Curva Planificada en Plan de Manejo',
    criterioFiscalizacion:
      'Permite constatar si la organización pesquera está acelerando la extracción por encima del ritmo biológico sustentable aprobado.'
  }
};

// =========================================================================
// 3. MOTOR DE INTERPOLACIÓN DINÁMICA DE PARÁMETROS VIGENTES (T9)
// =========================================================================

export const DEFAULT_CONFIG_VALUES = {
  desembarque_unidad_base: 'kg',
  desembarque_umbral_atipico_kg: '5000',
  desembarque_fuente_recolector_activa: 'true',
  desembarque_fuente_armador_activa: 'true',
  desembarque_fuente_area_activa: 'true',
  captura_politica_sin_factor: 'USAR_DEFAULT',
  captura_factor_default: '1.0000',
  cuota_umbral_restante_pct: '10.0',
  cuota_desvio_velocidad_pct: '25.0',
  cuota_dias_previos_expiracion: '5',
  cuota_accion_post_cierre: 'ALERTA_CRITICA',
  cuota_accion_exceso_limite: 'ALERTA_EXCESO',
  veda_modo_operacion: 'BLOQUEO_ESTRICTO',
  veda_dias_aviso_previo: '7',
  variacion_peso_umbral_general_pct: '5.0',
  retencion_bodega_activo: 'true',
  retencion_bodega_dias_amarilla: '3',
  retencion_bodega_dias_naranja: '5',
  retencion_bodega_dias_roja: '7',
  retencion_bodega_estados_sujetos: 'HÚMEDO',
  bio_perdida_activo: 'true',
  bio_humedo_dias_minimos_transito: '3',
  bio_humedo_merma_minima_pct: '5.0',
  bio_seco_merma_maxima_pct: '3.0'
};

/**
 * Sustituye marcadores del tipo {{clave}} o {{clave:default}} con los valores
 * vigentes del mapa de configuración general o los valores por defecto del sistema.
 */
export function interpolateText(text, configMap = {}) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)(?::([^}]+))?\s*\}\}/g, (match, key, inlineDefault) => {
    if (configMap && configMap[key] !== undefined && configMap[key] !== null && configMap[key] !== '') {
      return String(configMap[key]);
    }
    if (inlineDefault !== undefined) {
      return String(inlineDefault);
    }
    if (DEFAULT_CONFIG_VALUES[key] !== undefined) {
      return String(DEFAULT_CONFIG_VALUES[key]);
    }
    return match;
  });
}

/**
 * Recorre recursivamente un objeto o arreglo de metadatos interpolando todas sus cadenas de texto.
 */
export function interpolateMetadata(metaObj, configMap = {}) {
  if (!metaObj || typeof metaObj !== 'object') return metaObj;

  if (Array.isArray(metaObj)) {
    return metaObj.map((item) => interpolateMetadata(item, configMap));
  }

  const result = {};
  for (const [k, v] of Object.entries(metaObj)) {
    if (typeof v === 'string') {
      result[k] = interpolateText(v, configMap);
    } else if (typeof v === 'object' && v !== null) {
      result[k] = interpolateMetadata(v, configMap);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Función auxiliar para obtener los metadatos de un indicador por su clave o título.
 * Si se pasa `configMap`, interpola los valores configurables en caliente; de lo contrario,
 * utiliza los valores oficiales normativos por defecto.
 */
export function getIndicadorMetadata(keyOrTitle, configMap = null) {
  if (!keyOrTitle) return null;
  let rawItem = INDICADORES_METADATA[keyOrTitle];

  if (!rawItem) {
    const normalized = keyOrTitle.toLowerCase().trim();
    const foundKey = Object.keys(INDICADORES_METADATA).find((k) => {
      const item = INDICADORES_METADATA[k];
      return (
        item.nombre.toLowerCase().includes(normalized) ||
        item.id.toLowerCase() === normalized ||
        normalized.includes(item.id.toLowerCase())
      );
    });
    if (foundKey) {
      rawItem = INDICADORES_METADATA[foundKey];
    }
  }

  if (!rawItem) return null;
  return interpolateMetadata(rawItem, configMap || DEFAULT_CONFIG_VALUES);
}

