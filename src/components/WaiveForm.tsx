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

import * as React from 'react';
import { useState, useEffect} from 'react';
import {
    ActionGroup,
    Alert,
    Button,
    Checkbox,
    Form,
    FormGroup,
    FormGroupProps,
    Modal,
    Text,
    TextArea,
    TextContent,
    TextVariants,
} from '@patternfly/react-core';
import { useApolloClient, useLazyQuery } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import {
    ExternalLinkSquareAltIcon,
} from '@patternfly/react-icons';

import { docs } from '../config';
import { createWaiver, submitWaiver, resetWaiverReply } from '../actions';
import { IStateWaiver } from '../actions/types';
import { RootStateType } from '../reducers';
import { getTestcaseName } from '../utils/artifactUtils';
import _ from 'lodash';
import { MetadataConsolidated } from '../queries/Metadata';
import { KnownIssue, Dependency, Contact } from './PageMetadataList';


export interface MetadataPayload {
    contact?: Contact;
    description?: string;
    dependency?: Dependency[];
    known_issues?: KnownIssue[];
    waive_message?: string;
}

/* Based on reply from server */
export interface Metadata {
    payload?: MetadataPayload;
}

interface MetadataConsolidatedResult {
    metadata_consolidated: Metadata;
}


const WaiveForm: React.FC<{}> = () => {
    const dispatch = useDispatch();
    const client = useApolloClient();
    const waive = useSelector<RootStateType, IStateWaiver>(
        (store) => store.waive,
    );
    const [value, setValue] = useState('');
    const [checked, setChecked] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [validated, setValidated] =
        useState<FormGroupProps['validated']>('default');
    const [madeRequest, setMadeRequest] = useState(false);

    const handleTextInputChange = (value: string) => {
        /* Require that the waiver message have at least three words as a gross proxy. */
        const isValid = value.trim().split(/\s+/).length > 2;
        const validated = isValid ? 'success' : 'error';
        setValue(value);
        setIsValid(isValid);
        setValidated(validated);
    };

    const [getMetadata, { loading: qLoading, error: qError, data: metadata }] =
    useLazyQuery<MetadataConsolidatedResult>(MetadataConsolidated, {
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        if (_.isNil(waive.state)) {
            return;
        }
        const testcase_name = getTestcaseName(waive.state);
        getMetadata({ variables: { testcase_name: testcase_name } });
    }, []);

    const onClickCancel = () => {
        dispatch(createWaiver(undefined, undefined));
    };

    const onClickSubmit = () => {
        const reason = value;
        dispatch(resetWaiverReply());
        setMadeRequest(true);
        dispatch(submitWaiver(reason, client));
    };

    const invalidText =
        'Reason must have detailed explanation. Provide links to issues, bugs, etc';
    const helperText = '';
    const agreementLabel = 'I agree and acknowledge the above information';

    const metadataLoaded = !qLoading && !qError && metadata;
    const metadataAggrementText = metadataLoaded ? metadata?.metadata_consolidated?.payload?.waive_message : '';
    const agreementText = `Waiving test results may have an impact on the RHEL release process. Broken builds can lead to broken RHEL 
    composes and unverified or failed builds can cause issues in system integration. Before waiving these tests it is good to check 
    other possible options, in particular some CI-systems can fail due to outages and different circumstances. It is good to restart 
    the test or to contact CI-owners for assistance. Proceed waiving test-result only when other efforts have not succeeded.`;
    const { state, waiveError, timestamp } = waive;
    if (_.isNil(state)) {
        return null;
    }
    const waiver_for = getTestcaseName(state);
    return (
        <>
            <TextContent>
                <Text component={TextVariants.h3}>{waiver_for}</Text>
            </TextContent>
            <Form onSubmit={(event) => event.preventDefault()}>
                <TextContent>
                    <Text
                        style={{ marginTop: '0.5em' }}
                        component={TextVariants.small}
                    >
                        {metadataAggrementText || agreementText}
                    </Text>
                </TextContent>
                <FormGroup
                    fieldId="reason"
                    helperText={helperText}
                    helperTextInvalid={invalidText}
                    isRequired
                    label="Reason"
                    validated={validated}
                >
                    <TextArea
                        aria-describedby="age-helper"
                        className="pf-m-resize-vertical"
                        id="reason"
                        onChange={handleTextInputChange}
                        validated={validated}
                        value={value}
                    />
                </FormGroup>
                <FormGroup
                    fieldId="rquired-agreement"
                    isRequired
                    label="Required agreement"
                >
                    <Checkbox
                        label={agreementLabel}
                        id="required-check"
                        name="required-check"
                        onChange={setChecked}
                        isChecked={checked}
                    />
                </FormGroup>

                <ActionGroup>
                    <Button
                        isDisabled={!isValid || !checked}
                        isLoading={madeRequest && !waiveError && !timestamp}
                        onClick={onClickSubmit}
                        variant="primary"
                    >
                        Submit
                    </Button>
                    <Button variant="secondary" onClick={onClickCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="pf-u-ml-auto"
                        component="a"
                        href={docs.waiving}
                        icon={<ExternalLinkSquareAltIcon />}
                        iconPosition="right"
                        rel="noopener noreferrer"
                        target="_blank"
                        variant="link"
                    >
                        Waiving documentation
                    </Button>
                </ActionGroup>
                {waiveError && (
                    <Alert
                        isInline
                        isPlain
                        title="Could not submit waiver"
                        variant="danger"
                    >
                        {waiveError}
                    </Alert>
                )}
            </Form>
        </>
    );
};

export const WaiveModal: React.FC<{}> = () => {
    const dispatch = useDispatch();
    const waive = useSelector<RootStateType, IStateWaiver>(
        (store) => store.waive,
    );
    const { state, artifact, timestamp } = waive;
    const showWaiveForm = state && artifact && !timestamp;
    const onClose = () => {
        dispatch(createWaiver(undefined, undefined));
    };
    return (
        <>
            <Modal
                variant="medium"
                title="Waive test tesult"
                isOpen={showWaiveForm}
                onClose={onClose}
            >
                <WaiveForm />
            </Modal>
        </>
    );
};
