/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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

import _ from 'lodash';
import * as React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import {
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListItemRow,
    DataListContent,
    DataListItemCells,
} from '@patternfly/react-core';

import styles from '../custom.module.css';
import { StateGreenwaveKaiType } from '../artifact';
import { ArtifactStateProps } from './ArtifactState';
import {
    GreenwaveResult,
    GreenwaveWaiver,
    GreenwaveResultData,
    GreenwaveRequirement,
    FaceForGreenwaveState,
    GreenwaveStateActions,
} from './ArtifactGreenwaveState';
import { KaiStateXunit } from './ArtifactKaiState';

const timestampForUser = (inp: string, fromNow = false): string => {
    const time = moment.utc(inp).local().format('YYYY-MM-DD HH:mm Z');
    if (!fromNow) {
        return time;
    }
    const passed = moment.utc(inp).local().fromNow();
    const ret = time + ' (' + passed + ')';
    return ret;
};

export interface ArtifactGreenwaveKaiStateProps extends ArtifactStateProps {
    state: StateGreenwaveKaiType;
}
export const ArtifactGreenwaveKaiState: React.FC<
    ArtifactGreenwaveKaiStateProps
> = (props) => {
    const {
        state,
        artifact,
        stateName,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;

    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (!forceExpand) {
            const key = state.gs.testcase;
            setExpandedResult(key);
        } else if (forceExpand) {
            setExpandedResult('');
        }
    };
    /** Note for info test results */
    let resultClasses = classNames(styles['helpSelect'], {
        [styles.expandedResult]: forceExpand,
    });
    const key = state.gs.testcase;
    const toRender = (
        <DataListItem
            key={key}
            isExpanded={forceExpand}
            className={resultClasses}
            aria-labelledby="artifact-item-result"
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    onClick={onToggle}
                    isExpanded={forceExpand}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForGreenwaveState
                                state={state.gs}
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="Primary Content Result Details"
                id="ex-result-expand1"
                isHidden={!forceExpand}
            >
                {forceExpand && (
                    <>
                        <GreenwaveStateActions
                            state={state.gs}
                            artifact={artifact}
                        />
                        <GreenwaveResult state={state.gs} />
                        <GreenwaveWaiver state={state.gs} />
                        <GreenwaveResultData state={state.gs} />
                        <GreenwaveRequirement state={state.gs} />
                        <KaiStateXunit state={state.ks} artifact={artifact} />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
