<?php
/**
 * CoherenceValidator - Validacion de coherencia del protocolo de investigacion
 *
 * Verifica la coherencia interna entre los diferentes elementos del protocolo.
 * Los pasos coinciden con el frontend:
 *   1=Problema, 2=Pregunta, 3=Objetivos, 4=Variables,
 *   5=Diseno, 6=Muestra, 7=Instrumentos
 */
class CoherenceValidator
{
    /**
     * Validar un paso especifico del protocolo
     *
     * @param array $protocol Datos del protocolo
     * @param int $step Numero de paso (1-7)
     * @return array Resultados de validacion
     */
    public function validateStep($protocol, $step)
    {
        switch ($step) {
            case 1:
                return $this->validateProblemStatement($protocol);
            case 2:
                return $this->validateResearchQuestion($protocol);
            case 3:
                return $this->validateObjectives($protocol);
            case 4:
                return $this->validateVariables($protocol);
            case 5:
                return $this->validateDesign($protocol);
            case 6:
                return $this->validateSample($protocol);
            case 7:
                return $this->validateInstruments($protocol);
            default:
                return array();
        }
    }

    /**
     * Validar todo el protocolo
     *
     * @param array $protocol
     * @return array
     */
    public function validateAll($protocol)
    {
        $results = array();
        for ($step = 1; $step <= 7; $step++) {
            $stepResults = $this->validateStep($protocol, $step);
            $results = array_merge($results, $stepResults);
        }
        // Validar hipotesis opcionalmente si existe
        $hypothesis = isset($protocol['hypothesis']) ? trim($protocol['hypothesis']) : '';
        if (!empty($hypothesis)) {
            $results = array_merge($results, $this->validateHypothesis($protocol));
        }
        return $results;
    }

    /**
     * Paso 1: Validar planteamiento del problema
     */
    private function validateProblemStatement($protocol)
    {
        $results = array();
        $text = isset($protocol['problem_statement']) ? trim($protocol['problem_statement']) : '';

        if (empty($text)) {
            $results[] = array(
                'field' => 'problem_statement',
                'status' => 'incompleto',
                'message' => 'El planteamiento del problema esta vacio',
                'suggestion' => 'Describe el contexto del problema, su relevancia y por que es necesario investigarlo. Incluye datos o evidencias que respalden la existencia del problema.'
            );
            return $results;
        }

        $wordCount = str_word_count($text);
        if ($wordCount < 50) {
            $results[] = array(
                'field' => 'problem_statement',
                'status' => 'incoherente',
                'message' => 'El planteamiento es demasiado breve (' . $wordCount . ' palabras). Se recomiendan al menos 50 palabras.',
                'suggestion' => 'Amplia el planteamiento incluyendo: contexto del problema, antecedentes, evidencias de su existencia y por que es relevante investigarlo.'
            );
        } else {
            $results[] = array(
                'field' => 'problem_statement',
                'status' => 'valido',
                'message' => 'El planteamiento del problema tiene una extension adecuada (' . $wordCount . ' palabras)',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Paso 2: Validar pregunta de investigacion
     */
    private function validateResearchQuestion($protocol)
    {
        $results = array();
        $question = isset($protocol['research_question']) ? trim($protocol['research_question']) : '';

        if (empty($question)) {
            $results[] = array(
                'field' => 'research_question',
                'status' => 'incompleto',
                'message' => 'La pregunta de investigacion esta vacia',
                'suggestion' => 'Formula una pregunta clara que comience con: Como, Cual, Que, En que medida, De que manera.'
            );
            return $results;
        }

        if (substr(trim($question), -1) !== '?') {
            $results[] = array(
                'field' => 'research_question',
                'status' => 'incoherente',
                'message' => 'La pregunta de investigacion no termina con signo de interrogacion',
                'suggestion' => 'Asegurate de que tu pregunta sea interrogativa y termine con el signo ?'
            );
        }

        $interrogativeWords = array('como', 'cual', 'cuales', 'que', 'en que medida', 'de que manera', 'por que', 'donde', 'cuando', 'cuanto', 'cuanta');
        $lowerQuestion = strtolower($question);
        $hasInterrogative = false;
        foreach ($interrogativeWords as $word) {
            if (strpos($lowerQuestion, $word) !== false) {
                $hasInterrogative = true;
                break;
            }
        }

        if (!$hasInterrogative) {
            $results[] = array(
                'field' => 'research_question',
                'status' => 'incoherente',
                'message' => 'La pregunta no parece contener una palabra interrogativa adecuada',
                'suggestion' => 'Inicia tu pregunta con: Como, Cual, Que, En que medida, De que manera, Por que.'
            );
        }

        $problemStatement = isset($protocol['problem_statement']) ? strtolower(trim($protocol['problem_statement'])) : '';
        if (!empty($problemStatement) && !empty($question)) {
            $questionWords = $this->extractKeywords($question);
            $problemWords = $this->extractKeywords($problemStatement);
            $commonWords = array_intersect($questionWords, $problemWords);

            if (count($commonWords) < 2) {
                $results[] = array(
                    'field' => 'research_question',
                    'status' => 'incoherente',
                    'message' => 'La pregunta de investigacion parece no estar alineada con el planteamiento del problema',
                    'suggestion' => 'Asegurate de que la pregunta refleje el problema planteado. Deben compartir terminos clave y el enfoque tematico.'
                );
            } else {
                $results[] = array(
                    'field' => 'research_question',
                    'status' => 'valido',
                    'message' => 'La pregunta de investigacion es coherente con el planteamiento del problema',
                    'suggestion' => null
                );
            }
        }

        return $results;
    }

    /**
     * Paso 3: Validar objetivos
     */
    private function validateObjectives($protocol)
    {
        $results = array();
        $generalObjective = isset($protocol['general_objective']) ? trim($protocol['general_objective']) : '';
        $specificObjectives = isset($protocol['specific_objectives']) ? $protocol['specific_objectives'] : array();

        if (empty($generalObjective)) {
            $results[] = array(
                'field' => 'general_objective',
                'status' => 'incompleto',
                'message' => 'El objetivo general esta vacio',
                'suggestion' => 'El objetivo general debe comenzar con un verbo en infinitivo (Determinar, Analizar, Evaluar, Comparar) y describir el proposito principal de la investigacion.'
            );
        } else {
            $infinitiveEndings = array('ar', 'er', 'ir');
            $firstWord = strtolower(strtok($generalObjective, ' '));
            $hasInfinitive = false;
            foreach ($infinitiveEndings as $ending) {
                if (substr($firstWord, -strlen($ending)) === $ending && strlen($firstWord) > 3) {
                    $hasInfinitive = true;
                    break;
                }
            }

            if (!$hasInfinitive) {
                $results[] = array(
                    'field' => 'general_objective',
                    'status' => 'incoherente',
                    'message' => 'El objetivo general no parece comenzar con un verbo en infinitivo',
                    'suggestion' => 'Inicia el objetivo con un verbo en infinitivo: Determinar, Analizar, Evaluar, Identificar, Comparar, Describir.'
                );
            } else {
                $question = isset($protocol['research_question']) ? $protocol['research_question'] : '';
                if (!empty($question)) {
                    $objKeywords = $this->extractKeywords($generalObjective);
                    $qKeywords = $this->extractKeywords($question);
                    $common = array_intersect($objKeywords, $qKeywords);

                    if (count($common) < 2) {
                        $results[] = array(
                            'field' => 'general_objective',
                            'status' => 'incoherente',
                            'message' => 'El objetivo general no parece alinearse con la pregunta de investigacion',
                            'suggestion' => 'El objetivo general debe responder a la pregunta de investigacion. Usa terminos similares en ambos.'
                        );
                    } else {
                        $results[] = array(
                            'field' => 'general_objective',
                            'status' => 'valido',
                            'message' => 'El objetivo general es coherente con la pregunta de investigacion',
                            'suggestion' => null
                        );
                    }
                }
            }
        }

        if (!is_array($specificObjectives) || empty($specificObjectives)) {
            $results[] = array(
                'field' => 'specific_objectives',
                'status' => 'incompleto',
                'message' => 'No se han definido objetivos especificos',
                'suggestion' => 'Define al menos 2-3 objetivos especificos que desglosen el objetivo general en pasos concretos. Cada uno debe iniciar con un verbo en infinitivo.'
            );
        } elseif (count($specificObjectives) < 2) {
            $results[] = array(
                'field' => 'specific_objectives',
                'status' => 'incoherente',
                'message' => 'Se recomienda tener al menos 2 objetivos especificos',
                'suggestion' => 'Agrega mas objetivos especificos para cubrir las diferentes dimensiones del objetivo general.'
            );
        } else {
            $results[] = array(
                'field' => 'specific_objectives',
                'status' => 'valido',
                'message' => 'Los objetivos especificos tienen una cantidad adecuada (' . count($specificObjectives) . ')',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Paso 4: Validar variables
     */
    private function validateVariables($protocol)
    {
        $results = array();
        $variables = isset($protocol['variables']) ? $protocol['variables'] : array();

        if (empty($variables) || !is_array($variables)) {
            $results[] = array(
                'field' => 'variables',
                'status' => 'incompleto',
                'message' => 'No se han definido variables',
                'suggestion' => 'Define al menos una variable independiente y una dependiente. Cada variable debe tener nombre, tipo y definicion operacional.'
            );
            return $results;
        }

        $hasIndependent = false;
        $hasDependent = false;

        // Estructura con claves directas
        if (isset($variables['independiente']) || isset($variables['independent'])) {
            $hasIndependent = true;
        }
        if (isset($variables['dependiente']) || isset($variables['dependent'])) {
            $hasDependent = true;
        }

        // Array de variables con campo type/tipo
        if (isset($variables[0]) && is_array($variables[0])) {
            foreach ($variables as $var) {
                $type = isset($var['type']) ? strtolower($var['type']) : (isset($var['tipo']) ? strtolower($var['tipo']) : '');
                if (strpos($type, 'independiente') !== false || strpos($type, 'independent') !== false) {
                    $hasIndependent = true;
                }
                if (strpos($type, 'dependiente') !== false || strpos($type, 'dependent') !== false) {
                    $hasDependent = true;
                }
            }
        }

        if (!$hasIndependent) {
            $results[] = array(
                'field' => 'variables',
                'status' => 'incoherente',
                'message' => 'No se identifico una variable independiente',
                'suggestion' => 'Define la variable independiente: es la que manipulas o seleccionas como posible causa.'
            );
        }

        if (!$hasDependent) {
            $results[] = array(
                'field' => 'variables',
                'status' => 'incoherente',
                'message' => 'No se identifico una variable dependiente',
                'suggestion' => 'Define la variable dependiente: es el efecto o resultado que mides.'
            );
        }

        // Coherencia con pregunta de investigacion
        $question = isset($protocol['research_question']) ? strtolower($protocol['research_question']) : '';
        if (!empty($question)) {
            $varNames = $this->extractVariableNames($variables);
            $foundInQuestion = false;
            foreach ($varNames as $name) {
                if (strpos($question, strtolower($name)) !== false) {
                    $foundInQuestion = true;
                    break;
                }
            }

            if (!$foundInQuestion && !empty($varNames)) {
                $results[] = array(
                    'field' => 'variables',
                    'status' => 'incoherente',
                    'message' => 'Las variables definidas no parecen mencionarse en la pregunta de investigacion',
                    'suggestion' => 'Asegurate de que los nombres de tus variables aparezcan en la pregunta u objetivos. Deben estar alineados.'
                );
            }
        }

        if ($hasIndependent && $hasDependent) {
            $results[] = array(
                'field' => 'variables',
                'status' => 'valido',
                'message' => 'Se identificaron variables independiente y dependiente',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Paso 5: Validar diseno de investigacion
     */
    private function validateDesign($protocol)
    {
        $results = array();
        $design = isset($protocol['research_design']) ? $protocol['research_design'] : array();

        if (empty($design) || !is_array($design)) {
            $results[] = array(
                'field' => 'research_design',
                'status' => 'incompleto',
                'message' => 'No se ha definido el diseno de investigacion',
                'suggestion' => 'Define el tipo (experimental, cuasi-experimental, no experimental), enfoque (cuantitativo, cualitativo, mixto) y alcance (exploratorio, descriptivo, correlacional, explicativo).'
            );
            return $results;
        }

        // Aceptar claves en espanol o ingles
        $tipo = isset($design['tipo']) ? $design['tipo'] : (isset($design['type']) ? $design['type'] : '');
        $enfoque = isset($design['enfoque']) ? $design['enfoque'] : (isset($design['approach']) ? $design['approach'] : '');
        $alcance = isset($design['alcance']) ? $design['alcance'] : (isset($design['scope']) ? $design['scope'] : '');

        if (empty($tipo)) {
            $results[] = array(
                'field' => 'research_design',
                'status' => 'incompleto',
                'message' => 'No se especifico el tipo de diseno',
                'suggestion' => 'Indica el tipo: experimental, cuasi-experimental o no experimental.'
            );
        }

        if (empty($enfoque)) {
            $results[] = array(
                'field' => 'research_design',
                'status' => 'incompleto',
                'message' => 'No se especifico el enfoque',
                'suggestion' => 'Indica el enfoque: cuantitativo, cualitativo o mixto.'
            );
        }

        if (empty($alcance)) {
            $results[] = array(
                'field' => 'research_design',
                'status' => 'incompleto',
                'message' => 'No se especifico el alcance',
                'suggestion' => 'Indica el alcance: exploratorio, descriptivo, correlacional o explicativo.'
            );
        }

        // Coherencia diseno-variables
        if (!empty($tipo)) {
            $lowerTipo = strtolower($tipo);
            if (strpos($lowerTipo, 'experimental') !== false && strpos($lowerTipo, 'no ') === false && strpos($lowerTipo, 'no-') === false) {
                $results[] = array(
                    'field' => 'research_design',
                    'status' => 'valido',
                    'message' => 'El diseno experimental es coherente con la presencia de variables',
                    'suggestion' => 'Verifica que puedas realmente manipular la variable independiente en tu estudio.'
                );
            }
        }

        if (!empty($tipo) && !empty($enfoque)) {
            $results[] = array(
                'field' => 'research_design',
                'status' => 'valido',
                'message' => 'El diseno de investigacion tiene los componentes principales definidos',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Paso 6: Validar muestra
     */
    private function validateSample($protocol)
    {
        $results = array();
        $sample = isset($protocol['sample']) ? $protocol['sample'] : array();

        if (empty($sample) || !is_array($sample)) {
            $results[] = array(
                'field' => 'sample',
                'status' => 'incompleto',
                'message' => 'No se ha definido la muestra',
                'suggestion' => 'Define la poblacion objetivo, el tamano de la muestra, el tipo de muestreo y la justificacion.'
            );
            return $results;
        }

        // Aceptar claves en espanol o ingles
        $poblacion = isset($sample['poblacion']) ? $sample['poblacion'] : (isset($sample['population']) ? $sample['population'] : '');
        $tamano = isset($sample['tamano']) ? $sample['tamano'] : (isset($sample['size']) ? $sample['size'] : '');
        $muestreo = isset($sample['tipo_muestreo']) ? $sample['tipo_muestreo'] : (isset($sample['technique']) ? $sample['technique'] : (isset($sample['sampling_type']) ? $sample['sampling_type'] : ''));

        if (empty($poblacion)) {
            $results[] = array(
                'field' => 'sample',
                'status' => 'incompleto',
                'message' => 'No se definio la poblacion objetivo',
                'suggestion' => 'Describe la poblacion de la que se extraera la muestra.'
            );
        }

        if (empty($tamano)) {
            $results[] = array(
                'field' => 'sample',
                'status' => 'incompleto',
                'message' => 'No se especifico el tamano de la muestra',
                'suggestion' => 'Indica cuantos participantes incluira tu muestra y justifica el numero.'
            );
        }

        if (empty($muestreo)) {
            $results[] = array(
                'field' => 'sample',
                'status' => 'incompleto',
                'message' => 'No se especifico el tipo de muestreo',
                'suggestion' => 'Indica si el muestreo sera probabilistico o no probabilistico.'
            );
        }

        if (!empty($tamano) && is_numeric($tamano)) {
            $sampleSize = (int)$tamano;
            if ($sampleSize < 10) {
                $results[] = array(
                    'field' => 'sample',
                    'status' => 'incoherente',
                    'message' => 'El tamano de muestra (' . $sampleSize . ') podria ser insuficiente',
                    'suggestion' => 'Considera aumentar el tamano. Para estudios cuantitativos se recomienda un minimo de 30 participantes.'
                );
            } else {
                $results[] = array(
                    'field' => 'sample',
                    'status' => 'valido',
                    'message' => 'La muestra tiene un tamano adecuado (' . $sampleSize . ' participantes)',
                    'suggestion' => null
                );
            }
        }

        return $results;
    }

    /**
     * Paso 7: Validar instrumentos
     */
    private function validateInstruments($protocol)
    {
        $results = array();
        $instruments = isset($protocol['instruments']) ? $protocol['instruments'] : array();

        if (empty($instruments) || !is_array($instruments)) {
            $results[] = array(
                'field' => 'instruments',
                'status' => 'incompleto',
                'message' => 'No se han definido instrumentos de recoleccion de datos',
                'suggestion' => 'Define al menos un instrumento (cuestionario, entrevista, observacion, escala) indicando que variable mide.'
            );
            return $results;
        }

        // Verificar cobertura de variables
        $variables = isset($protocol['variables']) ? $protocol['variables'] : array();
        $varNames = $this->extractVariableNames($variables);

        if (count($varNames) > 0) {
            $instrumentText = strtolower(json_encode($instruments));
            $coveredVars = 0;
            foreach ($varNames as $varName) {
                if (strpos($instrumentText, strtolower($varName)) !== false) {
                    $coveredVars++;
                }
            }

            if ($coveredVars === 0) {
                $results[] = array(
                    'field' => 'instruments',
                    'status' => 'incoherente',
                    'message' => 'Los instrumentos no parecen cubrir las variables definidas',
                    'suggestion' => 'Asegurate de que cada variable tenga al menos un instrumento que la mida.'
                );
            } else {
                $results[] = array(
                    'field' => 'instruments',
                    'status' => 'valido',
                    'message' => 'Los instrumentos cubren al menos algunas de las variables definidas',
                    'suggestion' => null
                );
            }
        } else {
            $results[] = array(
                'field' => 'instruments',
                'status' => 'valido',
                'message' => 'Se definieron ' . count($instruments) . ' instrumento(s) de recoleccion',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Validacion opcional: hipotesis (no es un paso del wizard, pero se valida si existe)
     */
    private function validateHypothesis($protocol)
    {
        $results = array();
        $hypothesis = isset($protocol['hypothesis']) ? trim($protocol['hypothesis']) : '';

        if (empty($hypothesis)) {
            return $results;
        }

        $wordCount = str_word_count($hypothesis);
        if ($wordCount < 8) {
            $results[] = array(
                'field' => 'hypothesis',
                'status' => 'incoherente',
                'message' => 'La hipotesis es demasiado breve (' . $wordCount . ' palabras)',
                'suggestion' => 'Una hipotesis debe ser una proposicion clara que establezca la relacion esperada entre las variables de estudio.'
            );
        }

        $relationWords = array('relacion', 'influye', 'afecta', 'determina', 'mayor', 'menor', 'aumenta', 'disminuye', 'correlacion', 'asocia', 'incide', 'impacta', 'significativ', 'diferencia', 'efecto', 'causa');
        $lowerHypothesis = strtolower($hypothesis);
        $hasRelation = false;
        foreach ($relationWords as $word) {
            if (strpos($lowerHypothesis, $word) !== false) {
                $hasRelation = true;
                break;
            }
        }

        if (!$hasRelation) {
            $results[] = array(
                'field' => 'hypothesis',
                'status' => 'incoherente',
                'message' => 'La hipotesis no parece establecer una relacion entre variables',
                'suggestion' => 'Incluye palabras que indiquen relacion: influye, afecta, correlacion, relacion significativa.'
            );
        } else {
            $results[] = array(
                'field' => 'hypothesis',
                'status' => 'valido',
                'message' => 'La hipotesis establece una relacion entre variables',
                'suggestion' => null
            );
        }

        return $results;
    }

    /**
     * Extraer palabras clave significativas de un texto
     */
    private function extractKeywords($text)
    {
        $text = strtolower($text);
        $text = preg_replace('/[^\p{L}\s]/u', '', $text);
        $words = preg_split('/\s+/', $text);

        $stopWords = array(
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
            'y', 'o', 'en', 'con', 'por', 'para', 'es', 'son', 'fue', 'ser', 'que',
            'se', 'su', 'sus', 'como', 'mas', 'pero', 'si', 'no', 'lo', 'le', 'les',
            'a', 'e', 'i', 'u', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
            'entre', 'sobre', 'cual', 'cuales', 'donde', 'cuando', 'muy', 'ya',
            'tambien', 'sin', 'hasta', 'desde', 'todo', 'todos', 'toda', 'todas',
            'otro', 'otra', 'otros', 'otras', 'ha', 'han', 'hay', 'tiene', 'tienen'
        );

        $keywords = array();
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) > 3 && !in_array($word, $stopWords)) {
                $keywords[] = $word;
            }
        }

        return array_unique($keywords);
    }

    /**
     * Extraer nombres de variables de la estructura de variables
     */
    private function extractVariableNames($variables)
    {
        $names = array();

        if (!is_array($variables)) {
            return $names;
        }

        // Estructura con claves directas
        $keys = array('independiente', 'dependiente', 'interviniente', 'independent', 'dependent', 'intervening');
        foreach ($keys as $key) {
            if (isset($variables[$key])) {
                $var = $variables[$key];
                if (is_string($var)) {
                    $names[] = $var;
                } elseif (is_array($var)) {
                    if (isset($var['nombre'])) {
                        $names[] = $var['nombre'];
                    } elseif (isset($var['name'])) {
                        $names[] = $var['name'];
                    }
                    if (isset($var[0])) {
                        foreach ($var as $subVar) {
                            if (is_string($subVar)) {
                                $names[] = $subVar;
                            } elseif (is_array($subVar)) {
                                if (isset($subVar['nombre'])) $names[] = $subVar['nombre'];
                                elseif (isset($subVar['name'])) $names[] = $subVar['name'];
                            }
                        }
                    }
                }
            }
        }

        // Array de objetos [{ name, type }, ...]
        if (isset($variables[0]) && is_array($variables[0])) {
            foreach ($variables as $var) {
                if (isset($var['nombre'])) {
                    $names[] = $var['nombre'];
                } elseif (isset($var['name'])) {
                    $names[] = $var['name'];
                }
            }
        }

        return $names;
    }
}
