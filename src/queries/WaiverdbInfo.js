import { gql } from '@apollo/client';

export default gql`
    query {
        waiverDbInfo {
            version
            auth_method
        }
    }
`;
