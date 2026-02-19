<?php
/**
 * DefenseQuestionGenerator - Genera preguntas para el simulador de defensa de tesis
 *
 * Las preguntas se generan basandose en el contenido del protocolo del estudiante,
 * usando el contenido como semilla para seleccion determinista.
 */
class DefenseQuestionGenerator
{
    /**
     * Plantillas de preguntas por categoria
     */
    private $questionTemplates = array(
        'fundamentacion' => array(
            array(
                'text' => 'Por que eligio este tema de investigacion? Cual es su motivacion principal?',
                'keywords' => array('motivacion', 'interes', 'relevancia', 'importancia', 'necesidad', 'problema', 'contexto'),
                'criteria' => 'El estudiante debe justificar la eleccion del tema con argumentos solidos sobre relevancia y necesidad.'
            ),
            array(
                'text' => 'Cual es la relevancia social y cientifica de su estudio?',
                'keywords' => array('impacto', 'beneficio', 'contribucion', 'sociedad', 'conocimiento', 'aporte', 'relevancia'),
                'criteria' => 'Debe mencionar impacto social y contribucion al conocimiento cientifico.'
            ),
            array(
                'text' => 'Que antecedentes respaldan la existencia del problema que plantea?',
                'keywords' => array('antecedente', 'estudio', 'investigacion', 'autor', 'dato', 'evidencia', 'previo'),
                'criteria' => 'Debe citar estudios previos o datos que evidencien el problema.'
            ),
            array(
                'text' => 'Que brecha de conocimiento pretende llenar su investigacion?',
                'keywords' => array('brecha', 'vacio', 'conocimiento', 'falta', 'carencia', 'no se ha', 'pendiente'),
                'criteria' => 'Debe identificar claramente lo que la literatura existente no ha abordado.'
            ),
            array(
                'text' => 'Como delimita su problema de investigacion en terminos temporales, espaciales y conceptuales?',
                'keywords' => array('delimitacion', 'temporal', 'espacial', 'contexto', 'periodo', 'lugar', 'alcance'),
                'criteria' => 'Debe especificar claramente los limites del estudio.'
            )
        ),
        'metodologia' => array(
            array(
                'text' => 'Por que eligio un enfoque {approach} para su investigacion?',
                'keywords' => array('enfoque', 'cuantitativo', 'cualitativo', 'mixto', 'paradigma', 'metodo', 'razon'),
                'criteria' => 'Debe justificar la eleccion del enfoque en relacion con sus objetivos y pregunta.'
            ),
            array(
                'text' => 'Justifique por que su diseno de investigacion es de tipo {type}.',
                'keywords' => array('diseno', 'tipo', 'experimental', 'no experimental', 'transversal', 'longitudinal', 'justificacion'),
                'criteria' => 'Debe explicar como el diseno se alinea con lo que busca investigar.'
            ),
            array(
                'text' => 'Cual es el alcance de su investigacion y por que considera que es el adecuado?',
                'keywords' => array('alcance', 'exploratorio', 'descriptivo', 'correlacional', 'explicativo', 'adecuado', 'nivel'),
                'criteria' => 'Debe justificar el nivel de profundidad elegido para el estudio.'
            ),
            array(
                'text' => 'Que alternativas metodologicas considero antes de elegir su diseno actual?',
                'keywords' => array('alternativa', 'opcion', 'considere', 'compare', 'descarte', 'ventaja', 'desventaja'),
                'criteria' => 'Debe demostrar conocimiento de otras opciones y por que las descarto.'
            ),
            array(
                'text' => 'Como garantiza la validez interna de su estudio con el diseno elegido?',
                'keywords' => array('validez', 'interna', 'control', 'amenaza', 'sesgo', 'variable', 'extrana'),
                'criteria' => 'Debe identificar amenazas a la validez y como las controla.'
            )
        ),
        'muestra' => array(
            array(
                'text' => 'Como garantiza la representatividad de su muestra?',
                'keywords' => array('representatividad', 'muestra', 'poblacion', 'generalizar', 'seleccion', 'criterio', 'proporcion'),
                'criteria' => 'Debe explicar como la muestra representa a la poblacion de estudio.'
            ),
            array(
                'text' => 'Por que eligio la tecnica de muestreo {technique}?',
                'keywords' => array('muestreo', 'tecnica', 'probabilistico', 'conveniencia', 'aleatorio', 'estratificado', 'razon'),
                'criteria' => 'Debe justificar la tecnica en relacion con su poblacion y recursos.'
            ),
            array(
                'text' => 'Como calculo el tamano de su muestra? Es estadisticamente suficiente?',
                'keywords' => array('tamano', 'calculo', 'formula', 'significativo', 'estadistica', 'potencia', 'suficiente'),
                'criteria' => 'Debe explicar el criterio o formula usada para determinar el tamano.'
            ),
            array(
                'text' => 'Cuales son los criterios de inclusion y exclusion de su muestra?',
                'keywords' => array('inclusion', 'exclusion', 'criterio', 'participante', 'requisito', 'condicion', 'seleccion'),
                'criteria' => 'Debe definir claramente quien participa y quien no, y por que.'
            ),
            array(
                'text' => 'Que sesgos de seleccion podrian afectar su muestra y como los mitiga?',
                'keywords' => array('sesgo', 'seleccion', 'mitigar', 'controlar', 'error', 'riesgo', 'limitacion'),
                'criteria' => 'Debe identificar posibles sesgos y estrategias para reducirlos.'
            )
        ),
        'instrumentos' => array(
            array(
                'text' => 'Como valido su instrumento {instrument_name}?',
                'keywords' => array('validacion', 'validez', 'contenido', 'constructo', 'experto', 'juicio', 'piloto'),
                'criteria' => 'Debe describir el proceso de validacion del instrumento.'
            ),
            array(
                'text' => 'Que garantiza la confiabilidad de sus instrumentos de recoleccion?',
                'keywords' => array('confiabilidad', 'alfa', 'cronbach', 'consistencia', 'test-retest', 'fiabilidad', 'coeficiente'),
                'criteria' => 'Debe mencionar metodos para asegurar la confiabilidad.'
            ),
            array(
                'text' => 'Su instrumento cubre todas las dimensiones de las variables que pretende medir?',
                'keywords' => array('dimension', 'variable', 'indicador', 'operacional', 'medir', 'cobertura', 'item'),
                'criteria' => 'Debe demostrar la correspondencia entre variables e items del instrumento.'
            ),
            array(
                'text' => 'Ha considerado posibles sesgos de respuesta en su instrumento?',
                'keywords' => array('sesgo', 'deseabilidad', 'social', 'aquiescencia', 'respuesta', 'neutral', 'pregunta'),
                'criteria' => 'Debe identificar sesgos como deseabilidad social y como los minimiza.'
            ),
            array(
                'text' => 'Realizo una prueba piloto de su instrumento? Que resultados obtuvo?',
                'keywords' => array('piloto', 'prueba', 'resultado', 'ajuste', 'modificacion', 'retroalimentacion', 'aplicacion'),
                'criteria' => 'Debe describir si hizo prueba piloto y que aprendio de ella.'
            )
        ),
        'coherencia' => array(
            array(
                'text' => 'Como se relacionan sus objetivos especificos con su pregunta de investigacion?',
                'keywords' => array('objetivo', 'pregunta', 'relacion', 'responder', 'coherencia', 'alinear', 'derivar'),
                'criteria' => 'Debe mostrar que cada objetivo contribuye a responder la pregunta.'
            ),
            array(
                'text' => 'Sus variables son coherentes con el diseno de investigacion elegido?',
                'keywords' => array('variable', 'diseno', 'coherente', 'consistente', 'medir', 'relacion', 'tipo'),
                'criteria' => 'Debe explicar la coherencia entre variables y diseno metodologico.'
            ),
            array(
                'text' => 'Como se conecta su hipotesis con el marco teorico de su investigacion?',
                'keywords' => array('hipotesis', 'teoria', 'marco', 'fundamentar', 'sustento', 'base', 'derivar'),
                'criteria' => 'Debe mostrar que la hipotesis se desprende del marco teorico.'
            ),
            array(
                'text' => 'Existe coherencia entre su problema, pregunta, objetivos e hipotesis?',
                'keywords' => array('coherencia', 'alineacion', 'problema', 'pregunta', 'objetivo', 'hipotesis', 'logico'),
                'criteria' => 'Debe demostrar el hilo conductor entre todos los elementos.'
            ),
            array(
                'text' => 'Como se asegura de que sus instrumentos miden exactamente lo que sus objetivos plantean?',
                'keywords' => array('instrumento', 'objetivo', 'medir', 'operacionalizar', 'variable', 'correspondencia', 'alinear'),
                'criteria' => 'Debe mostrar la correspondencia directa entre instrumentos y objetivos.'
            )
        ),
        'limitaciones' => array(
            array(
                'text' => 'Cuales son las principales limitaciones de su estudio?',
                'keywords' => array('limitacion', 'restriccion', 'alcance', 'no puede', 'dificultad', 'barrera', 'debilidad'),
                'criteria' => 'Debe identificar honestamente las limitaciones metodologicas y practicas.'
            ),
            array(
                'text' => 'Que sesgos podrian afectar los resultados de su investigacion?',
                'keywords' => array('sesgo', 'resultado', 'afectar', 'influir', 'distorsionar', 'error', 'validez'),
                'criteria' => 'Debe identificar sesgos potenciales y su impacto en los resultados.'
            ),
            array(
                'text' => 'Que tan generalizables serian los resultados de su estudio?',
                'keywords' => array('generalizar', 'extrapolar', 'aplicar', 'contexto', 'poblacion', 'validez', 'externa'),
                'criteria' => 'Debe evaluar la validez externa y alcance de sus conclusiones.'
            ),
            array(
                'text' => 'Que consideraciones eticas ha tomado en cuenta para su investigacion?',
                'keywords' => array('etica', 'consentimiento', 'confidencialidad', 'anonimato', 'dano', 'proteger', 'participante'),
                'criteria' => 'Debe mencionar medidas eticas como consentimiento informado y confidencialidad.'
            ),
            array(
                'text' => 'Si pudiera redisenar su estudio, que cambiaria y por que?',
                'keywords' => array('mejorar', 'cambiar', 'redisenar', 'diferente', 'alternativa', 'fortalecer', 'debilidad'),
                'criteria' => 'Debe demostrar capacidad autocritica y vision para mejorar el estudio.'
            )
        )
    );

    /**
     * Generar preguntas de defensa basadas en el protocolo
     *
     * @param array $protocol Datos del protocolo (con JSON ya decodificado)
     * @param int $count Numero de preguntas a generar (default 5)
     * @return array Lista de preguntas con categoria, texto y criterios
     */
    public function generateQuestions($protocol, $count = 5)
    {
        $questions = array();
        $categories = array_keys($this->questionTemplates);

        // Usar contenido del protocolo como semilla para seleccion determinista
        $seed = $this->generateSeed($protocol);

        // Seleccionar categorias balanceadas (asegurar diversidad)
        $selectedCategories = array();
        $catCount = count($categories);
        for ($i = 0; $i < $count; $i++) {
            $catIndex = ($seed + $i * 7) % $catCount;
            $selectedCategories[] = $categories[$catIndex];
        }

        // Generar una pregunta por cada categoria seleccionada
        foreach ($selectedCategories as $index => $category) {
            $templates = $this->questionTemplates[$category];
            $templateIndex = ($seed + $index * 13) % count($templates);
            $template = $templates[$templateIndex];

            // Personalizar la pregunta con datos del protocolo
            $text = $this->personalizeQuestion($template['text'], $protocol, $category);
            $context = $this->generateContext($protocol, $category);

            $questions[] = array(
                'category' => $category,
                'text' => $text,
                'context' => $context,
                'keywords' => $template['keywords'],
                'criteria' => $template['criteria']
            );
        }

        return $questions;
    }

    /**
     * Evaluar la respuesta del estudiante a una pregunta
     *
     * @param array $question La pregunta (con keywords y criteria)
     * @param string $answer La respuesta del estudiante
     * @param array $protocol El protocolo del estudiante
     * @return int Score de 0 a 100
     */
    public function evaluateAnswer($question, $answer, $protocol)
    {
        $answer = trim($answer);
        $score = 0;

        if (empty($answer)) {
            return 0;
        }

        $lowerAnswer = strtolower($answer);
        $wordCount = str_word_count($answer);

        // Criterio 1: Longitud minima (max 20 pts)
        // >30 palabras = base de 20pts
        if ($wordCount >= 60) {
            $score += 20;
        } elseif ($wordCount >= 30) {
            $score += 20;
        } elseif ($wordCount >= 15) {
            $score += 10;
        } elseif ($wordCount >= 5) {
            $score += 5;
        }

        // Criterio 2: Mencion de conceptos clave del protocolo (max 40 pts)
        $protocolTerms = $this->extractProtocolTerms($protocol);
        $matchedTerms = 0;
        foreach ($protocolTerms as $term) {
            if (strpos($lowerAnswer, strtolower($term)) !== false) {
                $matchedTerms++;
            }
        }
        $termScore = count($protocolTerms) > 0
            ? min(40, (int)(($matchedTerms / max(1, count($protocolTerms))) * 60))
            : 0;
        // Bonus por mencionar muchos terminos
        $termScore = min(40, $termScore + min(10, $matchedTerms * 2));
        $score += $termScore;

        // Criterio 3: Coherencia con la pregunta/categoria (max 40 pts)
        $keywords = isset($question['keywords']) ? $question['keywords'] : array();
        $keywordMatches = 0;
        foreach ($keywords as $keyword) {
            if (strpos($lowerAnswer, strtolower($keyword)) !== false) {
                $keywordMatches++;
            }
        }
        $keywordScore = count($keywords) > 0
            ? min(25, (int)(($keywordMatches / count($keywords)) * 40))
            : 0;

        // Verificar uso de argumentacion
        $argumentWords = array(
            'porque', 'ya que', 'debido', 'por lo tanto', 'considero',
            'argumento', 'evidencia', 'segun', 'de acuerdo', 'fundamento',
            'razon', 'por esta razon', 'en consecuencia', 'puesto que'
        );
        $argumentCount = 0;
        foreach ($argumentWords as $word) {
            if (strpos($lowerAnswer, $word) !== false) {
                $argumentCount++;
            }
        }
        $argumentScore = min(15, $argumentCount * 5);

        $score += $keywordScore + $argumentScore;

        return max(0, min(100, $score));
    }

    /**
     * Generar semilla numerica basada en el contenido del protocolo
     *
     * @param array $protocol
     * @return int
     */
    private function generateSeed($protocol)
    {
        $content = '';
        $content .= isset($protocol['problem_statement']) ? $protocol['problem_statement'] : '';
        $content .= isset($protocol['research_question']) ? $protocol['research_question'] : '';
        $content .= isset($protocol['general_objective']) ? $protocol['general_objective'] : '';
        $content .= isset($protocol['hypothesis']) ? $protocol['hypothesis'] : '';

        if (empty($content)) {
            return 42; // semilla por defecto
        }

        // Usar crc32 para generar un numero determinista a partir del texto
        return abs(crc32($content));
    }

    /**
     * Personalizar el texto de la pregunta con datos del protocolo
     *
     * @param string $text
     * @param array $protocol
     * @param string $category
     * @return string
     */
    private function personalizeQuestion($text, $protocol, $category)
    {
        // Reemplazar placeholders con datos reales del protocolo
        $design = isset($protocol['research_design']) ? $protocol['research_design'] : array();
        $sample = isset($protocol['sample']) ? $protocol['sample'] : array();
        $instruments = isset($protocol['instruments']) ? $protocol['instruments'] : array();

        // {approach}
        $approach = '';
        if (is_array($design)) {
            $approach = isset($design['approach']) ? $design['approach'] : (isset($design['enfoque']) ? $design['enfoque'] : 'seleccionado');
        }
        $text = str_replace('{approach}', $approach, $text);

        // {type}
        $type = '';
        if (is_array($design)) {
            $type = isset($design['type']) ? $design['type'] : (isset($design['tipo']) ? $design['tipo'] : 'seleccionado');
        }
        $text = str_replace('{type}', $type, $text);

        // {technique}
        $technique = '';
        if (is_array($sample)) {
            $technique = isset($sample['technique']) ? $sample['technique'] : (isset($sample['tecnica']) ? $sample['tecnica'] : 'seleccionada');
        }
        $text = str_replace('{technique}', $technique, $text);

        // {instrument_name}
        $instrumentName = 'principal';
        if (is_array($instruments) && !empty($instruments)) {
            $first = is_array($instruments[0]) ? $instruments[0] : $instruments;
            $instrumentName = isset($first['name']) ? $first['name'] : (isset($first['nombre']) ? $first['nombre'] : 'principal');
        }
        $text = str_replace('{instrument_name}', $instrumentName, $text);

        return $text;
    }

    /**
     * Generar contexto relevante del protocolo para la pregunta
     *
     * @param array $protocol
     * @param string $category
     * @return string
     */
    private function generateContext($protocol, $category)
    {
        switch ($category) {
            case 'fundamentacion':
                $ps = isset($protocol['problem_statement']) ? $protocol['problem_statement'] : '';
                if (!empty($ps)) {
                    return 'Basado en su planteamiento: "' . $this->truncate($ps, 150) . '"';
                }
                return 'Considere el planteamiento del problema de su protocolo.';

            case 'metodologia':
                $design = isset($protocol['research_design']) ? $protocol['research_design'] : array();
                if (is_array($design) && !empty($design)) {
                    $parts = array();
                    if (isset($design['approach'])) {
                        $parts[] = 'enfoque ' . $design['approach'];
                    }
                    if (isset($design['type'])) {
                        $parts[] = 'diseno ' . $design['type'];
                    }
                    if (isset($design['scope'])) {
                        $parts[] = 'alcance ' . $design['scope'];
                    }
                    if (!empty($parts)) {
                        return 'Su protocolo indica: ' . implode(', ', $parts) . '.';
                    }
                }
                return 'Considere el diseno metodologico de su protocolo.';

            case 'muestra':
                $sample = isset($protocol['sample']) ? $protocol['sample'] : array();
                if (is_array($sample) && !empty($sample)) {
                    $parts = array();
                    if (isset($sample['population'])) {
                        $parts[] = 'poblacion: ' . $this->truncate($sample['population'], 80);
                    }
                    if (isset($sample['size'])) {
                        $parts[] = 'tamano: ' . $sample['size'];
                    }
                    if (isset($sample['technique'])) {
                        $parts[] = 'tecnica: ' . $sample['technique'];
                    }
                    if (!empty($parts)) {
                        return 'Su muestra: ' . implode(', ', $parts) . '.';
                    }
                }
                return 'Considere la muestra definida en su protocolo.';

            case 'instrumentos':
                $instruments = isset($protocol['instruments']) ? $protocol['instruments'] : array();
                if (is_array($instruments) && !empty($instruments)) {
                    $names = array();
                    foreach ($instruments as $inst) {
                        if (is_array($inst) && isset($inst['name'])) {
                            $names[] = $inst['name'];
                        }
                    }
                    if (!empty($names)) {
                        return 'Sus instrumentos: ' . implode(', ', $names) . '.';
                    }
                }
                return 'Considere los instrumentos de recoleccion de su protocolo.';

            case 'coherencia':
                $rq = isset($protocol['research_question']) ? $protocol['research_question'] : '';
                $go = isset($protocol['general_objective']) ? $protocol['general_objective'] : '';
                $parts = array();
                if (!empty($rq)) {
                    $parts[] = 'Pregunta: "' . $this->truncate($rq, 100) . '"';
                }
                if (!empty($go)) {
                    $parts[] = 'Objetivo: "' . $this->truncate($go, 100) . '"';
                }
                if (!empty($parts)) {
                    return implode(' | ', $parts);
                }
                return 'Considere la coherencia general de su protocolo.';

            case 'limitaciones':
                return 'Reflexione sobre las debilidades y alcances reales de su estudio.';

            default:
                return '';
        }
    }

    /**
     * Extraer terminos clave del protocolo para evaluar respuestas
     *
     * @param array $protocol
     * @return array
     */
    private function extractProtocolTerms($protocol)
    {
        $terms = array();

        // Extraer palabras clave de los campos del protocolo
        if (!empty($protocol['research_question'])) {
            $terms = array_merge($terms, $this->extractSignificantWords($protocol['research_question']));
        }

        if (!empty($protocol['general_objective'])) {
            $terms = array_merge($terms, $this->extractSignificantWords($protocol['general_objective']));
        }

        if (!empty($protocol['hypothesis'])) {
            $terms = array_merge($terms, $this->extractSignificantWords($protocol['hypothesis']));
        }

        // Variables
        $variables = isset($protocol['variables']) ? $protocol['variables'] : array();
        if (is_array($variables)) {
            foreach ($variables as $var) {
                if (is_array($var) && isset($var['name'])) {
                    $terms[] = strtolower($var['name']);
                }
            }
        }

        // Diseno
        $design = isset($protocol['research_design']) ? $protocol['research_design'] : array();
        if (is_array($design)) {
            if (isset($design['approach'])) {
                $terms[] = strtolower($design['approach']);
            }
            if (isset($design['type'])) {
                $terms[] = strtolower($design['type']);
            }
            if (isset($design['scope'])) {
                $terms[] = strtolower($design['scope']);
            }
        }

        // Muestra
        $sample = isset($protocol['sample']) ? $protocol['sample'] : array();
        if (is_array($sample) && isset($sample['technique'])) {
            $terms[] = strtolower($sample['technique']);
        }

        // Instrumentos
        $instruments = isset($protocol['instruments']) ? $protocol['instruments'] : array();
        if (is_array($instruments)) {
            foreach ($instruments as $inst) {
                if (is_array($inst) && isset($inst['name'])) {
                    $terms[] = strtolower($inst['name']);
                }
            }
        }

        return array_unique(array_filter($terms));
    }

    /**
     * Extraer palabras significativas de un texto (>4 caracteres, no stopwords)
     *
     * @param string $text
     * @return array
     */
    private function extractSignificantWords($text)
    {
        $stopwords = array(
            'para', 'como', 'esta', 'este', 'esto', 'esos', 'esas', 'unos', 'unas',
            'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras',
            'tiene', 'tienen', 'hacer', 'hace', 'desde', 'donde', 'cuando',
            'entre', 'sobre', 'tambien', 'hasta', 'puede', 'pueden', 'cual',
            'cuales', 'sido', 'sera', 'siendo', 'cada', 'mismo', 'misma',
            'porque', 'sino', 'pero', 'aunque', 'mientras', 'segun', 'dentro',
            'fuera', 'antes', 'despues', 'durante', 'tras', 'mediante', 'hacia'
        );

        $words = preg_split('/\s+/', strtolower(trim($text)));
        $significant = array();

        foreach ($words as $word) {
            $clean = preg_replace('/[^a-z0-9]/', '', $word);
            if (strlen($clean) > 4 && !in_array($clean, $stopwords)) {
                $significant[] = $clean;
            }
        }

        return array_slice(array_unique($significant), 0, 15);
    }

    /**
     * Truncar texto a una longitud maxima
     *
     * @param string $text
     * @param int $maxLength
     * @return string
     */
    private function truncate($text, $maxLength = 100)
    {
        if (strlen($text) <= $maxLength) {
            return $text;
        }
        return substr($text, 0, $maxLength) . '...';
    }
}
