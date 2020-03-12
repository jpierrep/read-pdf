var system_constants ={
    //setear PERMISOS DE ESCRITURA en las tablas correspondientes

    EMPRESAS:[{ID:0,NOMBRE:"GUARD SERVICE SEGURIDAD S.A.",RUT:"79.960.660-7",BD_SOFTLAND:"GUARD"},{ID:2,NOMBRE:"GS OUTSOURCING S.A.",RUT:"76.924.640-1",BD_SOFTLAND:"OUTSOURCINGSA"}],
    TABLE_AREA_NEG_PERSON:{database:'Softland (segun empresa)', table:'.[softland].[sw_areanegper]'},
    TABLE_AREA_NEG_EMPRESA:{database:'Softland (segun empresa)', table:'.softland.cwtaren'},
    TABLE_VARIABLES_PERSONA:{database:'Inteligencias', table:'TEST_APP_VIEW_SOFT_ESTRUCTURA_REMUNERACION'},
    VARIABLES_PARAMETERS:[{nombre:"LIQUIDO PAGO",variable:'H303'},{nombre:"RELIQUIDACION",variable:'H068'}]
  
}
module.exports = system_constants;

