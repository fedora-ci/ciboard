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

import * as React from 'react';
import {
    Chart,
    ChartBar,
    ChartAxis,
    ChartStack,
    ChartTooltip,
    getCustomTheme,
    ChartThemeColor,
    ChartThemeVariant,
} from '@patternfly/react-charts';

/**
 * map to labels colors:
 *
 * pass = green
 * fail = red
 * info = orange
 * unknown = blue
 */
import {
    c_label_m_green__icon_Color,
    c_label_m_red__icon_Color,
    c_label_m_orange__icon_Color,
    c_label_m_blue__icon_Color,
} from '@patternfly/react-tokens';

const colorScale: string[] = [
    /* passed */
    c_label_m_green__icon_Color.value,
    /* failed */
    c_label_m_red__icon_Color.value,
    /* info */
    c_label_m_orange__icon_Color.value,
    /* other/unknown */
    c_label_m_blue__icon_Color.value,
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
    Info: Number;
    Other: Number;
    Failed: Number;
    Passed: Number;
}

interface StatusChartProps {
    data: StatusChartData;
    width: number;
    height: number;
}

export function StatusChart({ data, height, width }: StatusChartProps) {
    const legendData = Object.entries(data).map(([status, count], i) => ({
        name: `${status} (${count})`,
    }));

    const makeLabel = (status: string, count: number): string => {
        let countLabel = `${count} results`;
        if (count === 0) countLabel = 'no results';
        else if (count === 1) countLabel = '1 result';
        return `${status}: ${countLabel}`;
    };

    return (
        <div style={{ height: `${height}px`, width: `${width}px` }}>
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
                                {
                                    name: status,
                                    x: 0,
                                    y: count,
                                    label: makeLabel(status, count),
                                },
                            ]}
                            key={status}
                            labelComponent={
                                <ChartTooltip constrainToVisibleArea />
                            }
                        />
                    ))}
                </ChartStack>
            </Chart>
        </div>
    );
}
