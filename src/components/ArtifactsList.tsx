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
    Card,
    Flex,
    Text,
    Title,
    Brand,
    Button,
    Spinner,
    CardBody,
    FlexItem,
    Bullseye,
    CardTitle,
    CardHeader,
    EmptyState,
    TextContent,
    CardActions,
    EmptyStateIcon,
    TitleSizes,
} from '@patternfly/react-core';

import { ReactComponent as RhLogo } from './../img/rhfavicon.svg';
import rhLogo from './../img/rhfavicon.svg';

import { useAppSelector } from '../hooks';
import { PaginationToolbar } from './PaginationToolbar';
import {
    Artifact,
    ArtifactRPM,
    GreenwaveDecisionReplyType,
    isArtifactRPM,
} from '../artifact';
import { ExclamationCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
    resultColor,
    isGatingArtifact,
    GatingStatusIcon,
} from '../utils/artifactUtils';

interface PrintRequirementsSizeProps {
    allReqs: { [key: string]: number };
    reqName: string;
}

const PrintRequirementsSize = (props: PrintRequirementsSizeProps) => {
    const { reqName, allReqs } = props;
    const color = resultColor(reqName);
    const style = { color: `var(${color})`, whiteSpace: 'nowrap' };
    return (
        <Title style={style} headingLevel="h1" size={TitleSizes['md']}>
            {allReqs[reqName]} {reqName}
        </Title>
    );
};

interface ArtifactGreenwaveStatesSummaryProps {
    artifact: ArtifactRPM;
    isLoading?: boolean;
}
export const ArtifactGreenwaveStatesSummary: React.FC<
    ArtifactGreenwaveStatesSummaryProps
> = (props) => {
    const { artifact, isLoading } = props;
    if (!isGatingArtifact(artifact)) {
        return null;
    }
    const decision: GreenwaveDecisionReplyType | undefined =
        artifact.greenwaveDecision;
    console.log(artifact);
    const isScratch = _.get(artifact, 'hitSource.scratch', false);
    if (isScratch) {
        return null;
    }
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
                    <EmptyStateIcon variant="container" component={Spinner} />
                    <Title headingLevel="h2" size="lg">
                        Loading search results…
                    </Title>
                </EmptyState>
            </Bullseye>
        </>
    );
}

interface ArtifactRPMCardProps {
    artifact: ArtifactRPM;
}
const ArtifactRPMCard = (props: ArtifactRPMCardProps) => {
    const { isLoadingExtended: isLoading } = useAppSelector(
        (state) => state.artifacts,
    );
    const { artifact } = props;
    const { hitInfo, hitSource, greenwaveDecision } = artifact;
    const hasGatingDecision = !_.isNil(greenwaveDecision);
    return (
        <Card id={hitInfo._id} isCompact>
            <CardHeader>
                <CardActions hasNoOffset={true}>
                    <Button variant="secondary">details</Button>
                </CardActions>
                <Flex
                    style={{ flexGrow: 1 }}
                    flexWrap={{ default: 'nowrap' }}
                    justifyContent={{ default: 'justifyContentSpaceBetween' }}
                >
                    <FlexItem>
                        <Brand alt="Red hat build" widths={{ default: '30px' }}>
                            <source srcSet={rhLogo} />
                        </Brand>
                    </FlexItem>
                    <FlexItem style={{ whiteSpace: 'nowrap' }}>
                        {hitSource.aType}
                    </FlexItem>
                    <FlexItem
                        style={{
                            whiteSpace: 'nowrap',
                            fontFamily:
                                'var(--pf-global--FontFamily--monospace)',
                            fontSize: '80%',
                        }}
                    >
                        <Link to="">{hitSource.taskId}</Link>
                    </FlexItem>
                    <FlexItem
                        style={{
                            fontWeight: 'var(--pf-c-card__title--FontWeight)',
                            fontSize: 'var(--pf-c-card__title--FontSize)',
                            fontFamily: 'var(--pf-c-card__title--FontFamily)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {hitSource.nvr}
                    </FlexItem>
                    <FlexItem style={{ whiteSpace: 'nowrap' }}>
                        {hitSource.issuer}
                    </FlexItem>
                    <FlexItem style={{ whiteSpace: 'nowrap' }}>
                        {hitSource.scratch}
                    </FlexItem>
                    <FlexItem
                        align={{ default: 'alignRight' }}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {hitSource.gateTag}
                    </FlexItem>
                    <FlexItem style={{ flex: '0 0 10%', whiteSpace: 'nowrap' }}>
                        <ArtifactGreenwaveStatesSummary
                            artifact={artifact}
                            isLoading={isLoading}
                        />
                    </FlexItem>
                </Flex>
            </CardHeader>
        </Card>
    );
};

/**
                <FlexItem>{hitSource.component}</FlexItem>
                <FlexItem>{hitSource.buildId}</FlexItem>
                <FlexItem>{hitSource.brokerMsgIdGateTag}</FlexItem>
 */

interface ArtifactCardProps {
    artifact: Artifact;
}
const ArtifactCard = (props: ArtifactCardProps) => {
    const { artifact } = props;
    if (isArtifactRPM(artifact)) {
        return <ArtifactRPMCard artifact={artifact} />;
    }
    return (
        <Flex>
            <FlexItem>{artifact.hitInfo._id}</FlexItem>
        </Flex>
    );
};

//<ArtifactCard artifact={artifact} />
interface ArtListProps {}
const ArtList = (_props: ArtListProps) => {
    const { artList } = useAppSelector((state) => state.artifacts);
    if (_.isEmpty(artList)) return null;
    const entries: JSX.Element[] = [];
    _.map(artList, (artifact: any) => {
        entries.push(
            <Flex>
                <FlexItem style={{ flex: '0 0 20%' }} />
                <FlexItem style={{ flexBasis: '60%' }}>
                    <ArtifactCard artifact={artifact} />
                </FlexItem>
            </Flex>,
        );
    });
    return (
        <>
            <Flex
                spaceItems={{ default: 'spaceItemsXs' }}
                direction={{ default: 'column' }}
                flexWrap={{ default: 'nowrap' }}
            >
                {entries}
            </Flex>
        </>
    );
};

interface NothingFoundProps {}
const NothingFound = (_props: NothingFoundProps) => {
    const { hitsInfo } = useAppSelector((state) => state.artifacts);
    const totalHits = hitsInfo?.total?.value;
    if (totalHits !== 0) return null;
    return (
        <Bullseye>
            <EmptyState>
                <EmptyStateIcon
                    className="pf-u-danger-color-100"
                    icon={ExclamationCircleIcon}
                />
                <Title headingLevel="h2" size="lg">
                    Nothing found
                </Title>
            </EmptyState>
        </Bullseye>
    );
};

export function ShowArtifacts() {
    return (
        <>
            <PaginationToolbar />
            <ShowLoading />
            <ArtList />
            <NothingFound />
        </>
    );
}

/*

                        {error && (
                            <EmptyStateBody>
                                Error: {error.toString()}
                            </EmptyStateBody>
                        )}
                        */
