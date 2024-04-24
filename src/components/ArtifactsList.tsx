/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import {
    Flex,
    Text,
    Title,
    Brand,
    Button,
    Spinner,
    FlexItem,
    Bullseye,
    TitleSizes,
    EmptyState,
    TextContent,
    EmptyStateIcon,
    EmptyStateHeader,
} from '@patternfly/react-core';
import { Td, Th, Tr, Table, Tbody, Thead } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import rhMbs from './../img/rhmbs.png';
import rhLogo from './../img/rhfavicon.svg';
import rhContLogo from './../img/rhcont.png';
import { useAppSelector } from '../hooks';
import { PaginationToolbar } from './PaginationToolbar';
import {
    resultColor,
    isGatingArtifact,
    GatingStatusIcon,
} from '../utils/utils';
import {
    Artifact,
    getAType,
    ArtifactRpm,
    ArtifactMbs,
    isArtifactMbs,
    isArtifactRpm,
    getArtifactLocalPath,
    ArtifactContainerImage,
    GreenwaveDecisionReply,
    isArtifactRedhatContainerImage,
    getArtifactTypeLabel,
    getArtifactId,
    getArtifactRemoteUrl,
} from '../types';
import { ExternalLink } from './ExternalLink';

interface PrintRequirementsSizeProps {
    allReqs: { [key: string]: number };
    reqName: string;
}

const PrintRequirementsSize = (props: PrintRequirementsSizeProps) => {
    const { reqName, allReqs } = props;
    const color = resultColor(reqName);
    const style: CSSProperties = {
        color: `var(${color})`,
        whiteSpace: 'nowrap',
    };
    return (
        <Title style={style} headingLevel="h1" size={TitleSizes['md']}>
            {allReqs[reqName]} {reqName}
        </Title>
    );
};

interface ArtifactGreenwaveStatesSummaryProps {
    artifact: ArtifactRpm | ArtifactContainerImage | ArtifactMbs;
}
export const ArtifactGreenwaveStatesSummary: React.FC<
    ArtifactGreenwaveStatesSummaryProps
> = (props) => {
    const { artifact } = props;
    const { isLoadingExtended: isLoading } = useAppSelector(
        (state) => state.artifacts,
    );
    const isScratch = _.get(artifact, 'hit_source.scratch', false);
    if (isScratch) {
        return <>scratch</>;
    }
    if (!isGatingArtifact(artifact)) {
        return null;
    }
    const decision: GreenwaveDecisionReply | undefined =
        artifact.greenwaveDecision;
    if (_.isNil(decision) && !isLoading) {
        return null;
    }

    const reqSummary: { [name: string]: number } = {};
    /*
     * Ignore the 'fetched-gating-yaml' virtual test as we dont display it in the UI.
     * It is prevented from displaying in `ArtifactStatesList()`:
     *     `if (stateName === 'fetched-gating-yaml') continue;`
     */
    const unsatisfiedCount = decision?.unsatisfied_requirements?.length;
    const satisfiedCount = decision?.satisfied_requirements?.filter(
        ({ type }) => type !== 'fetched-gating-yaml',
    ).length;
    if (unsatisfiedCount) {
        reqSummary['err'] = unsatisfiedCount;
    }
    if (satisfiedCount) {
        reqSummary['ok'] = satisfiedCount;
    }

    const gatingPassed = decision?.policies_satisfied;
    const iconStyle = { height: '1.2em' };
    const statusIcon = isLoading ? null : (
        <GatingStatusIcon status={gatingPassed} style={iconStyle} />
    );

    return (
        <Flex flexWrap={{ default: 'nowrap' }}>
            <FlexItem>
                <TextContent>
                    <Text>{statusIcon}</Text>
                </TextContent>
            </FlexItem>
            {_.map(reqSummary, (_len, reqName) => (
                <FlexItem key={reqName} spacer={{ default: 'spacerMd' }}>
                    <PrintRequirementsSize
                        reqName={reqName}
                        allReqs={reqSummary}
                    />
                </FlexItem>
            ))}
            {isLoading && (
                <FlexItem spacer={{ default: 'spacerMd' }}>
                    <Spinner size="sm" />
                </FlexItem>
            )}
        </Flex>
    );
};

interface ShowLoadingProps {}
function ShowLoading(props: ShowLoadingProps) {
    const { isLoading } = useAppSelector((state) => state.artifacts);
    if (!isLoading) return null;
    return (
        <>
            <Bullseye>
                <EmptyState>
                    <EmptyStateHeader
                        titleText="Loading search results…"
                        icon={<EmptyStateIcon icon={Spinner} />}
                        headingLevel="h2"
                    />
                </EmptyState>
            </Bullseye>
        </>
    );
}

const makeArtifactRowRpm = (artifact: ArtifactRpm): ArtifactRow => {
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat build" widths={{ default: '30px' }}>
                <source srcSet={rhLogo} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const artId = getArtifactId(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nvr}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary artifact={artifact} />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.gateTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

const makeArtifactRowRedhatContainerImage = (
    artifact: ArtifactContainerImage,
): ArtifactRow => {
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat container image" widths={{ default: '30px' }}>
                <source srcSet={rhContLogo} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const artId = getArtifactId(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nvr}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary artifact={artifact} />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.contTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

const makeArtifactRowMbs = (artifact: ArtifactMbs): ArtifactRow => {
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat container image" widths={{ default: '30px' }}>
                <source srcSet={rhMbs} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artId = getArtifactId(artifact);
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nsvc}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary artifact={artifact} />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.gateTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

type ArtifactRow =
    | [
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
      ]
    | undefined;

const columnNames = {
    logo: '',
    aType: 'Type',
    id: 'Id',
    artifactName: 'Name',
    issuer: 'Issuer',
    gateTag: 'Build tag',
    gatingStatus: 'Gating status',
    details: '',
};

const makeArtifactRow = (artifact: Artifact): ArtifactRow | undefined => {
    if (isArtifactRpm(artifact)) {
        return makeArtifactRowRpm(artifact);
    }
    if (isArtifactRedhatContainerImage(artifact)) {
        return makeArtifactRowRedhatContainerImage(artifact);
    }
    if (isArtifactMbs(artifact)) {
        return makeArtifactRowMbs(artifact);
    }
    //<FlexItem>{artifact.hit_info._id}</FlexItem>
};

interface ArtListProps {}
const ArtifactsTable = (_props: ArtListProps) => {
    const { artList } = useAppSelector((state) => state.artifacts);
    if (_.isEmpty(artList)) return null;
    const entries: ArtifactRow[] = [];
    _.map(artList, (artifact: any) => {
        entries.push(makeArtifactRow(artifact));
    });
    return (
        <>
            <Table aria-label="Simple table" variant="compact" borders={true}>
                <Thead>
                    <Tr>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.logo}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.aType}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.id}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.artifactName}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.gatingStatus}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.gateTag}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.issuer}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.details}
                        </Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {_.map(entries, (aRow, index) => {
                        if (!aRow) {
                            return <></>;
                        }
                        return (
                            <Tr key={index}>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.logo}
                                >
                                    {aRow[0]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.aType}
                                >
                                    {aRow[1]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'RedHatMono',
                                    }}
                                    dataLabel={columnNames.id}
                                >
                                    {aRow[2]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'RedHatDisplay',
                                    }}
                                    dataLabel={columnNames.artifactName}
                                >
                                    {aRow[3]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.gatingStatus}
                                >
                                    {aRow[4]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                    }}
                                    dataLabel={columnNames.gateTag}
                                >
                                    {aRow[5]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '12em',
                                    }}
                                    dataLabel={columnNames.issuer}
                                >
                                    {aRow[6]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                    }}
                                    dataLabel={columnNames.details}
                                >
                                    {aRow[7]}
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </>
    );
};

interface NothingFoundProps {}
const NothingFound = (_props: NothingFoundProps) => {
    const { hits_info } = useAppSelector((state) => state.artifacts);
    const totalHits = hits_info?.total?.value;
    if (totalHits !== 0) return null;
    return (
        <Bullseye>
            <EmptyState>
                <EmptyStateHeader
                    titleText="Nothing found"
                    icon={
                        <EmptyStateIcon
                            className="pf-v5-u-danger-color-100"
                            icon={ExclamationCircleIcon}
                        />
                    }
                    headingLevel="h2"
                />
            </EmptyState>
        </Bullseye>
    );
};

export function ShowArtifacts() {
    return (
        <>
            <PaginationToolbar />
            <ShowLoading />
            <ArtifactsTable />
            <NothingFound />
        </>
    );
}

/* XXX

                        {error && (
                            <EmptyStateBody>
                                Error: {error.toString()}
                            </EmptyStateBody>
                        )}
                        */
