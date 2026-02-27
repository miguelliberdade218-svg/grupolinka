---
description: O backend está tentando inserir dados em colunas que não existem na
  tabela bookings. A query SQL atual inclui colunas como 'hotelId' e
  'roomTypeId' que são específicas para reservas de hotéis, mas está sendo usada
  para reservas de rides.
alwaysApply: false
---

A tabela 'bookings' deve ter colunas consistentes para diferentes tipos de reservas (rides, hotéis, event spaces). Para reservas de rides, não devem ser usadas colunas específicas de hotéis como 'hotelId' ou 'roomTypeId'.