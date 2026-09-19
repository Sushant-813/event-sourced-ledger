package com.ledger.common.validation;

import com.ledger.common.exception.InvalidSortFieldException;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class SortValidator {

    private SortValidator() {
    }

    public static Sort validateAndBuild(
            String sortBy,
            String direction,
            Set<String> allowedFields) {

        if (!allowedFields.contains(sortBy)) {
            throw new InvalidSortFieldException(
                    "sortBy '" + sortBy
                            + "' is not supported for this endpoint. "
                            + "Allowed values: " + allowedFields);
        }

        if (!"asc".equalsIgnoreCase(direction)
                && !"desc".equalsIgnoreCase(direction)) {

            throw new InvalidSortFieldException(
                    "direction '" + direction
                            + "' is invalid. Allowed values: asc, desc");
        }

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);

        return Sort.by(sortDirection, sortBy)
                .and(Sort.by(sortDirection, "id"));
    }
}