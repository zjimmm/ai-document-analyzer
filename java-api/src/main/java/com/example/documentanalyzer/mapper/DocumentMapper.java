package com.example.documentanalyzer.mapper;

import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.entity.Document;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DocumentMapper {

    DocumentResponse toResponse(Document document);
}
