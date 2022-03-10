/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import React from 'react';
import {
    Chart,
    ChartAxis,
    ChartBar,
    ChartStack,
    ChartThemeColor,
    ChartThemeVariant,
    ChartTooltip,
    getCustomTheme,
} from '@patternfly/react-charts';
import {
    chart_color_blue_100,
    chart_color_blue_300,
    chart_color_blue_500,
    chart_color_red_100,
} from '@patternfly/react-tokens';

const colorScale: string[] = [
    chart_color_blue_300.value,
    chart_color_red_100.value,
    chart_color_blue_100.value,
    chart_color_blue_500.value,
];

const chartTheme = getCustomTheme(
    ChartThemeColor.default,
    ChartThemeVariant.default,
    {
        bar: { colorScale },
        chart: { colorScale },
        group: { colorScale },
        legend: { colorScale },
    },
);

interface StatusChartData {
    Failed: Number;
    Info: Number;
    Other: Number;
    Passed: Number;
};

interface StatusChartProps {
    data: StatusChartData;
    height: number;
    width: number;
};

export function StatusChart({ data, height, width }: StatusChartProps) {
    const legendData = Object.entries(data).map(
        ([status, count], i) => (
            { name: `${status} (${count})` }
        )
    );

    const makeLabel = (status: string, count: number): string => {
        let countLabel = `${count} results`;
        if (count === 0)
            countLabel = 'no results';
        else if (count === 1)
            countLabel = '1 result';
        return `${status}: ${countLabel}`;
    };

    return <div style={{ height: `${height}px`, width: `${width}px` }}>
        <Chart
            ariaDesc="Summary of test result statuses"
            ariaTitle="Stacked bar chart of the number of number in each status"
            height={height}
            legendData={legendData}
            legendPosition="bottom"
            padding={{
                right: 10,
                bottom: 60, // Adjusted to accommodate legend
                left: 10,
            }}
            theme={chartTheme}
            width={width}
        >
            <ChartAxis dependentAxis />
            <ChartStack horizontal colorScale={colorScale}>
                {Object.entries(data).map(([status, count]) => (
                    <ChartBar
                        barWidth={20}
                        data={[
                            { name: status, x: 0, y: count, label: makeLabel(status, count) },
                        ]}
                        key={status}
                        labelComponent={<ChartTooltip constrainToVisibleArea />}
                    />
                ))}
            </ChartStack>
        </Chart>
    </div>;
}
