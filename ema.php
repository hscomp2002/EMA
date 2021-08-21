 <?php
    function calculate(array $values, int $period = 9): array
    {
        if (empty($values) || count($values) < $period) {
            throw new \Exception('[' . __METHOD__ . '] $values parameters is empty');
        }

        $mult = 2 / ($period + 1);
        $ema[] = 0;
        foreach ($values as $value) {
            if (!is_numeric($value)) {
                throw new \Exception('[' . __METHOD__ . '] invalid value: ' . $value);
            }

            $prev = array_slice($ema, -1)[0];
            $ema[] = ($value - $prev) * $mult + $prev;
        }

        return array_reverse($ema);
    }

    $arr = [33504.69, 33786.55, 34669.13, 35286.51,
    33690.14, 34220.01, 33862.12, 32875.71,
    33815.81, 33502.87, 34258.99, 33086.63,
    32729.77, 32820.02,    31880, 31383.87,
    31520.07, 31778.56, 30839.65, 29790.35,
    32144.51, 32287.83, 33634.09, 34258.14,
    35381.02,  37237.6, 39457.87, 40019.56,
    40016.48, 42206.37, 41461.83, 39845.44,
    39147.82, 38207.05, 39723.18, 40862.46,
    42836.87, 44572.54, 43794.37,  46253.4,
    45584.99,    45511,    44399,    47800,
    47068.51, 46973.82, 45901.29, 44695.95,
    44705.29, 46760.62];
    $a = calculate($arr,9);
    var_dump($a);