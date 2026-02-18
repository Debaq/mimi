<?php
/**
 * MicroDefenseGenerator - Genera objeciones para micro defensas
 *
 * Los pasos coinciden con el frontend:
 *   1=Problema, 2=Pregunta, 3=Objetivos, 4=Variables,
 *   5=Diseno, 6=Muestra, 7=Instrumentos
 */
class MicroDefenseGenerator
{
    /**
     * Plantillas de objeciones por paso
     */
    private $objectionTemplates = array(
        1 => array(
            'Tu planteamiento describe la situacion, pero no queda claro por que esto constituye un problema que requiere investigacion. Podrias justificar la relevancia social o cientifica de estudiarlo?',
            'El planteamiento carece de datos o evidencias concretas que respalden la existencia del problema. Que antecedentes empiricos puedes citar?',
            'No se identifica claramente a la poblacion afectada por el problema. A quienes impacta especificamente y en que contexto?',
            'El problema planteado parece demasiado amplio. Como lo delimitas temporal, espacial y conceptualmente?',
            'No se percibe una brecha de conocimiento clara. Que es lo que la literatura existente NO ha abordado sobre este tema?'
        ),
        2 => array(
            'Tu pregunta parece poder responderse con un simple si o no. Como la reformularias para que requiera una investigacion mas profunda?',
            'La pregunta es demasiado amplia para una investigacion de este alcance. Como la delimitarias mejor?',
            'No se identifican claramente las variables en tu pregunta. Que fenomenos especificos estas relacionando?',
            'La pregunta no parece investigable empiricamente. Como medirias los conceptos que mencionas?',
            'Tu pregunta no delimita el contexto temporal ni espacial. En que poblacion y periodo se enfocaria el estudio?'
        ),
        3 => array(
            'El objetivo general parece mas un objetivo especifico. Cual seria el proposito mas amplio de tu investigacion?',
            'Los objetivos especificos no parecen derivarse del objetivo general. Como se conectan logicamente?',
            'Algunos objetivos no son medibles ni verificables. Como sabras que los has cumplido?',
            'Tus objetivos especificos no cubren todos los aspectos mencionados en el objetivo general. Que componentes faltan?',
            'Los verbos utilizados en los objetivos no reflejan el nivel de profundidad adecuado para el alcance de la investigacion. Que verbos serian mas apropiados?'
        ),
        4 => array(
            'La definicion operacional de tu variable independiente no es lo suficientemente precisa. Como la medirias en la practica?',
            'No has considerado posibles variables intervinientes que podrian afectar la relacion entre tus variables principales. Cuales podrian ser?',
            'Los indicadores que propones para tu variable dependiente podrian no capturar completamente el fenomeno. Que otros indicadores podrias usar?',
            'Existe riesgo de confundir correlacion con causalidad en tu planteamiento de variables. Como controlaras las variables extranas?',
            'La escala de medicion que propones para tus variables podria no ser la mas adecuada. Has considerado alternativas?'
        ),
        5 => array(
            'Has elegido un diseno no experimental, pero tu hipotesis parece implicar causalidad. Como resuelves esta inconsistencia?',
            'El enfoque cuantitativo que propones podria no capturar la complejidad del fenomeno. Has considerado un enfoque mixto?',
            'El alcance correlacional no permite establecer relaciones causales. Es esto suficiente para responder tu pregunta de investigacion?',
            'No queda claro como controlaras las amenazas a la validez interna de tu estudio. Que estrategias utilizaras?',
            'El diseno elegido podria no ser el mas eficiente para tus objetivos. Has considerado alternativas metodologicas?'
        ),
        6 => array(
            'El tamano de tu muestra podria ser insuficiente para obtener resultados estadisticamente significativos. Como lo justificas?',
            'El muestreo por conveniencia limita la generalizabilidad de los resultados. Que alternativa de muestreo podrias usar?',
            'Los criterios de inclusion/exclusion de tu muestra no estan bien definidos. Que parametros especificos usaras?',
            'La representatividad de tu muestra puede verse afectada por sesgos de seleccion. Como mitigaras este riesgo?',
            'No queda claro como calculaste el tamano de tu muestra. Utilizaste alguna formula o criterio estadistico?'
        ),
        7 => array(
            'No queda claro si tu instrumento ha sido validado previamente. Como garantizas su validez y confiabilidad?',
            'Tu instrumento podria no medir adecuadamente todas las dimensiones de tus variables. Como te aseguras de la cobertura completa?',
            'Has considerado la posibilidad de sesgo en tus instrumentos? Como minimizarias la deseabilidad social u otros sesgos de respuesta?',
            'El formato de tu instrumento podria no ser adecuado para la poblacion objetivo. Has realizado una prueba piloto?',
            'Si usas un instrumento adaptado de otro autor, como verificaste que es valido en tu contexto cultural y poblacional?'
        )
    );

    /**
     * Generar una objecion para un paso especifico del protocolo
     */
    public function generateForStep($protocol, $step)
    {
        $step = max(1, min(7, (int)$step));

        $templates = $this->objectionTemplates[$step];

        $contextual = $this->generateContextualObjection($protocol, $step);
        if ($contextual !== null) {
            return $contextual;
        }

        $index = array_rand($templates);
        return $templates[$index];
    }

    /**
     * Generar objecion contextualizada basada en el contenido del protocolo
     */
    private function generateContextualObjection($protocol, $step)
    {
        switch ($step) {
            case 1:
                $text = isset($protocol['problem_statement']) ? $protocol['problem_statement'] : '';
                if (!empty($text) && str_word_count($text) < 80) {
                    return 'Tu planteamiento del problema tiene solo ' . str_word_count($text) . ' palabras. Un planteamiento robusto requiere mayor desarrollo. Podrias ampliar los antecedentes del problema, incluir datos estadisticos y explicar la brecha de conocimiento que justifica tu investigacion?';
                }
                break;

            case 2:
                $question = isset($protocol['research_question']) ? $protocol['research_question'] : '';
                if (!empty($question) && substr(trim($question), -1) !== '?') {
                    return 'Tu pregunta de investigacion no tiene formato interrogativo. Una pregunta de investigacion debe formularse explicitamente como pregunta. Ademas, verifica que establezca claramente la relacion entre las variables que deseas estudiar.';
                }
                break;

            case 3:
                $objectives = isset($protocol['specific_objectives']) ? $protocol['specific_objectives'] : array();
                if (is_array($objectives) && count($objectives) <= 1) {
                    return 'Solo tienes ' . count($objectives) . ' objetivo especifico. Para una investigacion rigurosa, necesitas al menos 2-3 objetivos especificos que desglosen el objetivo general en componentes medibles y alcanzables. Como dividirias tu objetivo general en pasos mas concretos?';
                }
                break;

            case 4:
                $variables = isset($protocol['variables']) ? $protocol['variables'] : array();
                // Verificar si faltan variables intervinientes
                $hasIntervening = false;
                if (is_array($variables)) {
                    if (isset($variables['interviniente']) || isset($variables['intervening'])) {
                        $hasIntervening = true;
                    }
                    if (isset($variables[0]) && is_array($variables[0])) {
                        foreach ($variables as $var) {
                            $type = isset($var['type']) ? strtolower($var['type']) : (isset($var['tipo']) ? strtolower($var['tipo']) : '');
                            if (strpos($type, 'interviniente') !== false || strpos($type, 'intervening') !== false) {
                                $hasIntervening = true;
                                break;
                            }
                        }
                    }
                }
                if (!$hasIntervening) {
                    return 'No has definido variables intervinientes o de control. Toda investigacion tiene factores que pueden afectar la relacion entre la variable independiente y dependiente. Cuales podrian ser en tu caso y como las controlaras?';
                }
                break;

            case 5:
                $design = isset($protocol['research_design']) ? $protocol['research_design'] : array();
                $tipo = isset($design['tipo']) ? $design['tipo'] : (isset($design['type']) ? $design['type'] : '');
                $hypothesis = isset($protocol['hypothesis']) ? strtolower($protocol['hypothesis']) : '';
                if (!empty($tipo) && !empty($hypothesis)) {
                    $lowerTipo = strtolower($tipo);
                    if (strpos($lowerTipo, 'no experimental') !== false || strpos($lowerTipo, 'no-experimental') !== false) {
                        if (strpos($hypothesis, 'causa') !== false || strpos($hypothesis, 'efecto') !== false) {
                            return 'Has elegido un diseno no experimental, pero tu hipotesis sugiere relacion causal. Un diseno no experimental solo permite establecer correlaciones, no causalidad. Necesitas reformular tu hipotesis o cambiar el diseno. Cual prefieres modificar y por que?';
                        }
                    }
                }
                break;

            case 6:
                $sample = isset($protocol['sample']) ? $protocol['sample'] : array();
                $tamano = isset($sample['tamano']) ? $sample['tamano'] : (isset($sample['size']) ? $sample['size'] : '');
                if (!empty($tamano) && is_numeric($tamano) && (int)$tamano < 30) {
                    return 'Tu muestra de ' . $tamano . ' participantes podria ser insuficiente. Segun la teoria estadistica, muestras menores a 30 no permiten asumir distribucion normal. Como justificas este tamano? Has considerado calcular el tamano de muestra con una formula estadistica?';
                }
                break;

            case 7:
                $instruments = isset($protocol['instruments']) ? $protocol['instruments'] : array();
                if (is_array($instruments) && count($instruments) === 1) {
                    return 'Solo has definido un instrumento de recoleccion. Considera si necesitas triangular datos con multiples instrumentos para aumentar la validez de tu estudio. Es un solo instrumento suficiente para medir todas tus variables?';
                }
                break;
        }

        return null;
    }

    /**
     * Evaluar la respuesta del estudiante a una micro defensa
     *
     * @param int $defenseId ID de la micro defensa
     * @param string $response Respuesta del estudiante
     * @return int Puntuacion (0-100)
     */
    public function evaluateResponse($defenseId, $response)
    {
        $response = trim($response);
        $score = 0;

        if (empty($response)) {
            return 0;
        }

        // Criterio 1: Longitud de la respuesta (max 25 pts)
        $wordCount = str_word_count($response);
        if ($wordCount >= 50) {
            $score += 25;
        } elseif ($wordCount >= 30) {
            $score += 20;
        } elseif ($wordCount >= 15) {
            $score += 15;
        } elseif ($wordCount >= 5) {
            $score += 5;
        }

        // Criterio 2: Uso de argumentacion (max 25 pts)
        $argumentWords = array(
            'porque', 'ya que', 'debido', 'por lo tanto', 'en consecuencia',
            'considero', 'argumento', 'evidencia', 'fundamento', 'razon',
            'segun', 'de acuerdo', 'investigacion', 'estudio', 'autor',
            'teoria', 'dato', 'resultado', 'literatura', 'sustento'
        );
        $lowerResponse = strtolower($response);
        $argumentCount = 0;
        foreach ($argumentWords as $word) {
            if (strpos($lowerResponse, $word) !== false) {
                $argumentCount++;
            }
        }
        $score += min(25, $argumentCount * 5);

        // Criterio 3: Estructuracion (max 25 pts)
        $connectors = array(
            'primero', 'segundo', 'ademas', 'por otro lado', 'sin embargo',
            'en primer lugar', 'finalmente', 'en conclusion', 'asimismo',
            'no obstante', 'por ejemplo', 'es decir', 'en este sentido'
        );
        $connectorCount = 0;
        foreach ($connectors as $connector) {
            if (strpos($lowerResponse, $connector) !== false) {
                $connectorCount++;
            }
        }
        $score += min(25, $connectorCount * 8);

        // Criterio 4: Relevancia y especificidad (max 25 pts)
        $methodTerms = array(
            'variable', 'hipotesis', 'muestra', 'instrumento', 'validez',
            'confiabilidad', 'objetivo', 'diseno', 'poblacion', 'operacional',
            'indicador', 'dimension', 'metodologia', 'enfoque', 'alcance',
            'correlacion', 'causal', 'experimental', 'cualitativo', 'cuantitativo'
        );
        $methodCount = 0;
        foreach ($methodTerms as $term) {
            if (strpos($lowerResponse, $term) !== false) {
                $methodCount++;
            }
        }
        $score += min(25, $methodCount * 5);

        return max(0, min(100, $score));
    }
}
